'use strict';
import os from 'os'
import fs from 'fs'
import path from 'path'
import util from 'util'
import{ EventEmitter } from 'events'
import {Transform} from 'stream'
import ts from 'typescript'
var log      = util.debuglog('tsify');
var trace    = util.debuglog('tsify-trace');

/* -------------------------------------------------------------------------- */
/*                                 minithrough                                */
/* -------------------------------------------------------------------------- */
class DestroyableTransform extends Transform {
  _destroyed: boolean;
  constructor(opts) {
    super(opts)
    this._destroyed = false
}
destroy = function(err) {
  if (this._destroyed) return
  this._destroyed = true
  var self = this
  process.nextTick(function() {
    if (err)
      self.emit('error', err)
    self.emit('close')
  })
}
}
// a noop _transform function
function noop (chunk, enc, callback) {
  callback(null, chunk)
}
function create (construct) {
  return function (options?, transform?, flush?) {
    if (typeof options == 'function') {
      flush     = transform
      transform = options
      options   = {}
    }
    if (typeof transform != 'function')transform = noop
    if (typeof flush != 'function')flush = null
    return construct(options, transform, flush)
  }
}
let through = Object.assign(create(function (options, transform, flush) {
    var t2 = new DestroyableTransform(options)
    t2._transform = transform
    if (flush)t2._flush = flush
    return t2
  }),
{
  obj: create(function (options, transform, flush) {
    var t2 = new DestroyableTransform(Object.assign({ objectMode: true, highWaterMark: 16 }, options))
    t2._transform = transform
    if (flush) t2._flush = flush
    return t2
  })
})

/* -------------------------------------------------------------------------- */
/*                              source map helper                             */
/* -------------------------------------------------------------------------- */

const commentRegex = new RegExp(/^\s*\/(?:\/|\*)[@#]\s+sourceMappingURL=data:(?:application|text)\/json;(?:charset[:=]\S+?;)?base64,(?:.*)$/mg)
class Converter {
  sourcemap: any;
  constructor(sm) {
  sm = (v) => v.split(',').pop();
  sm = (v) => Buffer.from(v, 'base64').toString();
  this.sourcemap = sm;
}
toComment = function () {
  return '//# ' + 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + this.toBase64();
};
setProperty = function (key, value) {
  this.sourcemap[key] = value;
  return this;
};
}
var fromComment = function (comment) {
  return new Converter(comment.replace(/^\/\*/g, '//').replace(/\*\/$/g, ''));
};

var time = {
		start() {
		return process.hrtime();
	},
	stop(t0, message) {
		var tDiff = process.hrtime(t0);
		log('%d sec -- %s', (tDiff[0] + (tDiff[1] / 1000000000)).toFixed(4), message);
	}
}

/* -------------------------------------------------------------------------- */
/*                                    host                                    */
/* -------------------------------------------------------------------------- */



class Host extends EventEmitter {
		isCaseSensitiveFileSystem: any
		isCaseSensitive: any;
		currentDirectory: any;
		outputDirectory: any;
		rootDirectory: any;
		languageVersion: any;
		files: {};
		previousFiles: {};
		output: {};
		version: number;
		error: boolean;
		constructor(currentDirectory, opts) {
			super()
		
		this.currentDirectory = this.getCanonicalFileName(path.resolve(currentDirectory));
		this.outputDirectory = this.getCanonicalFileName(path.resolve(opts.outDir));
		this.rootDirectory = this.getCanonicalFileName(path.resolve(opts.rootDir));
		this.languageVersion = opts.target;
		this.files = {};
		this.previousFiles = {};
		this.output = {};
		this.version = 0;
		this.error = false;

		try {
			fs.accessSync(path.join(__dirname, path.basename(__filename).toUpperCase()), fs.constants.R_OK);
			this.isCaseSensitiveFileSystem = false;
		} 
		catch (error) {
			trace('Case sensitive detection error: %s', error);
			this.isCaseSensitiveFileSystem = true;
		}
		log('Detected case %s file system', this.isCaseSensitiveFileSystem ? 'sensitive' : 'insensitive');

		this.isCaseSensitive = !!opts.forceConsistentCasingInFileNames || this.isCaseSensitiveFileSystem;

	}

//	util.inherits(Host, EventEmitter);

	_reset = function () {
		this.previousFiles = this.files;
		this.files = {};
		this.output = {};
		this.error = false;
		++this.version;

		log('Resetting (version %d)', this.version);
	};

	_addFile = function (filename, root) {

		// Ensure that the relative file name is what's passed to
		// 'createSourceFile', as that's the name that will be used in error
		// messages, etc.

		var relative = path.relative(
			this.currentDirectory,
			this.getCanonicalFileName(path.resolve(this.currentDirectory, filename))
		);

		var canonical = this._canonical(filename);
		trace('Parsing %s', canonical);

		var text;
		try {
			text = fs.readFileSync(filename, 'utf-8');
		} catch (ex) {
			return;
		}

		var file;
		var current = this.files[canonical];
		var previous = this.previousFiles[canonical];
		var version;

		if (current && current.contents === text) {
			file = current.ts;
			version = current.version;
			trace('Reused current file %s (version %d)', canonical, version);
		} else if (previous && previous.contents === text) {
			file = previous.ts;
			version = previous.version;
			trace('Reused previous file %s (version %d)', canonical, version);
		} else {
			file = ts.createSourceFile(relative, text, this.languageVersion, true);
			version = this.version;
			trace('New version of source file %s (version %d)', canonical, version);
		}

		this.files[canonical] = {
			filename: relative,
			contents: text,
			ts: file,
			root: root,
			version: version,
			nodeModule: /\/node_modules\//i.test(canonical) && !/\.d\.ts$/i.test(canonical)
		};
		this.emit('file', canonical, relative);

		return file;
	};

	getSourceFile = function (filename) {
		if (filename === '__lib.d.ts') {
			return this.libDefault;
		}
		var canonical = this._canonical(filename);
		if (this.files[canonical]) {
			return this.files[canonical].ts;
		}
		return this._addFile(filename, false);
	};

	getDefaultLibFileName = function () {
		var libPath = path.dirname(ts.sys.getExecutingFilePath());
		var libFile = ts.getDefaultLibFileName({ target: this.languageVersion });
		return path.join(libPath, libFile)
	};

	writeFile = function (filename, data) {

		var outputCanonical = this._canonical(filename);
		log('Cache write %s', outputCanonical);
		this.output[outputCanonical] = data;

		var sourceCanonical = this._inferSourceCanonical(outputCanonical);
		var sourceFollowed = this._follow(path.dirname(sourceCanonical)) + '/' + path.basename(sourceCanonical);

		if (sourceFollowed !== sourceCanonical) {
			outputCanonical = this._inferOutputCanonical(sourceFollowed);
			log('Cache write (followed) %s', outputCanonical);
			this.output[outputCanonical] = data;
		}
	};

	getCurrentDirectory = function () {
		return this.currentDirectory;
	};

	// this?
	_getCanonicalFileName = function (filename) {
		return this.isCaseSensitiveFileSystem ? filename : filename.toLowerCase()
	}

	getCanonicalFileName = function (filename) {
		return this.isCaseSensitive ? filename : filename.toLowerCase()
	};

	useCaseSensitiveFileNames = function () {
		return this.isCaseSensitive;
	};

	getNewLine = function () {
		return os.EOL;
	};

	fileExists = function (filename) {
		return ts.sys.fileExists(filename);
	};

	readFile = function (filename) {
		return ts.sys.readFile(filename);
	};

	directoryExists = function (dirname) {
		return ts.sys.directoryExists(dirname);
	};

	getDirectories = function (dirname) {
		return ts.sys.getDirectories(dirname);
	};

	//idk?
	// getEnvironmentVariable = function (name) {
	// 	return ts.sys.getEnvironmentVariable(name);
	// };

	realpath = function (name) {
		return fs.realpathSync(name);
	};

	trace = function (message) {
		ts.sys.write(message + this.getNewLine());
	};

	_rootFilenames = function () {

		var rootFilenames = [];

		for (var filename in this.files) {
			if (!Object.hasOwnProperty.call(this.files, filename)) continue;
			if (!this.files[filename].root) continue;
			rootFilenames.push(filename);
		}
		return rootFilenames;
	}

	_nodeModuleFilenames = function () {

		var nodeModuleFilenames = [];

		for (var filename in this.files) {
			if (!Object.hasOwnProperty.call(this.files, filename)) continue;
			if (!this.files[filename].nodeModule) continue;
			nodeModuleFilenames.push(filename);
		}
		return nodeModuleFilenames;
	}

	_compile = function (opts) {

		var rootFilenames = this._rootFilenames();
		var nodeModuleFilenames = [];

		log('Compiling files:');
		rootFilenames.forEach(function (file) { log('  %s', file); });

//		if (semver.gte(ts.version, '2.0.0')) {
			ts.createProgram(rootFilenames, opts, this);
			nodeModuleFilenames = this._nodeModuleFilenames();
			log('  + %d file(s) found in node_modules', nodeModuleFilenames.length);
	//	}
		return ts.createProgram(rootFilenames.concat(nodeModuleFilenames), opts, this);
	}

	_output = function (filename) {

		var outputCanonical = this._inferOutputCanonical(filename);
		log('Cache read %s', outputCanonical);

		var output = this.output[outputCanonical];
		if (!output) {
			log('Cache miss on %s', outputCanonical);
		}
		return output;
	}

	_canonical = function (filename) {
		return this.getCanonicalFileName(path.resolve(
			this.currentDirectory,
			filename
		));
	}

	_inferOutputCanonical = function (filename) {

		var sourceCanonical = this._canonical(filename);
		var outputRelative = path.relative(
			this.rootDirectory,
			sourceCanonical
		);
		var outputCanonical = this.getCanonicalFileName(path.resolve(
			this.outputDirectory,
			outputRelative
		));
		return outputCanonical;
	}

	_inferSourceCanonical = function (filename) {

		var outputCanonical = this._canonical(filename);
		var outputRelative = path.relative(
			this.outputDirectory,
			outputCanonical
		);
		var sourceCanonical = this.getCanonicalFileName(path.resolve(
			this.rootDirectory,
			outputRelative
		));
		return sourceCanonical;
	}

	_follow = function (filename) {

		filename = this._canonical(filename);
		var basename;
		var parts = [];

		do {
			var stats = fs.lstatSync(filename);
			if (stats.isSymbolicLink()) {
				filename = fs.realpathSync(filename);
			} else {
				basename = path.basename(filename);
				if (basename) {
					parts.unshift(basename);
					filename = path.dirname(filename);
				}
			}
		} while (basename);

		return filename + parts.join('/')
	};
}



/* -------------------------------------------------------------------------- */
/*                                compile error                               */
/* -------------------------------------------------------------------------- */
//this wierd construct is required to get formatting right
function createCompileError() {
	function CompileError(diagnostic) {
		SyntaxError.call(this);

		this.message = '';

		if (diagnostic.file) {
			var loc = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
			this.fileName = diagnostic.file.fileName;
			this.line = loc.line + 1;
			this.column = loc.character + 1;
			this.message += this.fileName + '(' + this.line + ',' + this.column + '): ';
		}

		var category = ts.DiagnosticCategory[diagnostic.category];
		this.name = 'TypeScript error';
		this.message += category + ' TS' + diagnostic.code + ': ' +
			ts.flattenDiagnosticMessageText(diagnostic.messageText, os.EOL);
	}

	CompileError.prototype = Object.create(SyntaxError.prototype);

	return CompileError;
};

const CompileError = createCompileError()

/* -------------------------------------------------------------------------- */
/*                                   tsifier                                  */
/* -------------------------------------------------------------------------- */

	var currentDirectory = fs.realpathSync(process.cwd())

	var parseJsonConfigFileContent = ts.parseJsonConfigFileContent //|| ts.readConfigFile;

	function isTypescript(file) {
		return (/\.tsx?$/i).test(file);
	}

	function isTsx(file) {
		return (/\.tsx$/i).test(file);
	}

	function isJavascript(file) {
		return (/\.jsx?$/i).test(file);
	}

	function isTypescriptDeclaration(file) {
		return (/\.d\.ts$/i).test(file);
	}

	function replaceFileExtension(file, extension) {
		return file.replace(/\.\w+$/i, extension);
	}

	function fileExists(file) {
		try {
			var stats = fs.lstatSync(file);
			return stats.isFile();
		} catch (e) {
			return false;
		}
	}


	type ExpandedOptions = {
		module?: any
		project?: any
		target?: any
	}
	function parseOptions(opts, bopts) {

		// Expand any short-name, command-line options
		var expanded: ExpandedOptions = {};
		if (opts.m) { expanded.module = opts.m; }
		if (opts.p) { expanded.project = opts.p; }
		if (opts.t) { expanded.target = opts.t; }
		opts = Object.assign({}, expanded, opts);

		var config;
		var configFile;
		if (typeof opts.project === "object"){
			log('Using inline tsconfig');
			config = JSON.parse(JSON.stringify(opts.project));
			config.compilerOptions = config.compilerOptions || {};
			Object.assign(config.compilerOptions, opts);
		} 
		else {
			if (fileExists(opts.project)) {
				configFile = opts.project;
			} else {
				configFile = ts.findConfigFile(
					// normalize?
					(opts.project || bopts.basedir || currentDirectory),
					fileExists
				);
			}
			if (configFile) {
				log('Using tsconfig file at %s', configFile);

				config = JSON.parse(fs.readFileSync(configFile, {encoding: "utf-8"}))
				//tsconfig.readFileSync(configFile);
				config.compilerOptions = config.compilerOptions || {};
				Object.assign(config.compilerOptions, opts);
			} 
			else {
				config = {
					files: [],
					compilerOptions: opts
				};
			}
		}

		// Note that subarg parses command line arrays in its own peculiar way:
		// https://github.com/substack/subarg

		if (opts.exclude) {
			config.exclude = opts.exclude._ || opts.exclude;
		}
		if (opts.files) {
			config.files = opts.files._ || opts.files;
		}
		if (opts.include) {
			config.include = opts.include._ || opts.include;
		}

		var parsed = parseJsonConfigFileContent(
			config,
			ts.sys,
			configFile ? path.resolve(path.dirname(configFile)) : currentDirectory,
			null,
			configFile ?path.resolve(configFile): undefined
		);

		// Generate inline sourcemaps if Browserify's --debug option is set
		parsed.options.sourceMap = false;
		parsed.options.inlineSourceMap = bopts.debug;
		parsed.options.inlineSources = bopts.debug;

		// Default to CommonJS module mode
		parsed.options.module = parsed.options.module || ts.ModuleKind.CommonJS;

		// Blacklist --out/--outFile/--noEmit; these should definitely not be set, since we are doing
		// concatenation with Browserify instead
		delete parsed.options.out;
		delete parsed.options.outFile;
		delete parsed.options.noEmit;

		// Set rootDir and outDir so we know exactly where the TS compiler will be trying to
		// write files; the filenames will end up being the keys into our in-memory store.
		// The output directory needs to be distinct from the input directory to prevent the TS
		// compiler from thinking that it might accidentally overwrite source files, which would
		// prevent it from outputting e.g. the results of transpiling ES6 JS files with --allowJs.
		parsed.options.rootDir = path.relative('.', '/');
		parsed.options.outDir = path.resolve('/__tsify__')

		log('Files from tsconfig parse:');
		parsed.fileNames.forEach(function (filename) { log('  %s', filename); });

		var result = {
			options: parsed.options,
			fileNames: parsed.fileNames
		};

		return result;
	}



class Tsifier extends EventEmitter {
	static isTypescript: (file: any) => boolean;
	static isTypescriptDeclaration: (file: any) => boolean;
	opts: any;
	files: any;
	ignoredFiles: any[];
	bopts: any;
	host: any;
	
	constructor(opts, bopts) {
		super()
		var parsedOptions = parseOptions(opts, bopts);
		this.opts = parsedOptions.options;
		this.files = parsedOptions.fileNames;
		this.ignoredFiles = [];
		this.bopts = bopts;
		this.host = new Host(currentDirectory, this.opts);

		this.host.on('file', (file, id) => this.emit('file', file, id))
	}

	//util.inherits(Tsifier, events.EventEmitter);

	reset = function () {
		var self = this;
		self.ignoredFiles = [];
		self.host._reset();
		self.addFiles(self.files);
	};

	generateCache = function (files, ignoredFiles) {
		if (ignoredFiles) {
			this.ignoredFiles = ignoredFiles;
		}
		this.addFiles(files);
		this.compile();
	};

	addFiles = function (files) {
		var self = this;
		files.forEach(function (file) {
			self.host._addFile(file, true);
		});
	};

	compile = function () {
		var self = this;

		var createProgram_t0 = time.start();
		var program = self.host._compile(self.opts);
		time.stop(createProgram_t0, 'createProgram');

		var syntaxDiagnostics = self.checkSyntax(program);
		if (syntaxDiagnostics.length) {
			log('Compilation encountered fatal syntax errors');
			return;
		}

		var semanticDiagnostics = self.checkSemantics(program);
		if (semanticDiagnostics.length && self.opts.noEmitOnError) {
			log('Compilation encountered fatal semantic errors');
			return;
		}

		var emit_t0 = time.start();
		var emitOutput = program.emit();
		time.stop(emit_t0, 'emit program');

		var emittedDiagnostics = self.checkEmittedOutput(emitOutput);
		if (emittedDiagnostics.length && self.opts.noEmitOnError) {
			log('Compilation encountered fatal errors during emit');
			return;
		}

		log('Compilation completed without errors');
	};

	checkSyntax = function (program) {
		var self = this;

		var syntaxCheck_t0 = time.start();
		var syntaxDiagnostics = program.getSyntacticDiagnostics();
		time.stop(syntaxCheck_t0, 'syntax checking');

		syntaxDiagnostics.forEach(function (error) {
			self.emit('error', new CompileError(error));
		});

		if (syntaxDiagnostics.length) {
			self.host.error = true;
		}
		return syntaxDiagnostics;
	};

	checkSemantics = function (program) {
		var self = this;

		var semanticDiagnostics_t0 = time.start();
		var semanticDiagnostics = program.getGlobalDiagnostics();
		if (semanticDiagnostics.length === 0) {
			semanticDiagnostics = program.getSemanticDiagnostics();
		}
		time.stop(semanticDiagnostics_t0, 'semantic checking');

		semanticDiagnostics.forEach(function (error) {
			self.emit('error', new CompileError(error));
		});

		if (semanticDiagnostics.length && self.opts.noEmitOnError) {
			self.host.error = true;
		}

		return semanticDiagnostics;
	};

	checkEmittedOutput = function (emitOutput) {
		var self = this;

		var emittedDiagnostics = emitOutput.diagnostics;
		emittedDiagnostics.forEach(function (error) {
			self.emit('error', new CompileError(error));
		});

		if (emittedDiagnostics.length && self.opts.noEmitOnError) {
			self.host.error = true;
		}

		return emittedDiagnostics;
	};

	transform = function (file) {
		var self = this;

		trace('Transforming %s', file);

		if (self.ignoredFiles.indexOf(file) !== -1) {
			return through();
		}

		if (isTypescriptDeclaration(file)) {
			return through(transform);
		}

		if (isTypescript(file) || (isJavascript(file) && self.opts.allowJs)) {
			return through(transform, flush);
		}

		return through();

		function transform(chunk, enc, next) {
			next();
		}
		function flush(next) {
			if (self.host.error) {
				next();
				return;
			}

			var compiled = self.getCompiledFile(file);
			if (compiled) {
				this.push(compiled);
			}
			this.push(null);
			next();
		}
	};

	getCompiledFile = function (inputFile, alreadyMissedCache) {
		var self = this;
		var outputExtension = (ts.JsxEmit && self.opts.jsx === ts.JsxEmit.Preserve && isTsx(inputFile)) ? '.jsx' : '.js';
		var output = self.host._output(replaceFileExtension(inputFile, outputExtension));

		if (output === undefined) {
			if (alreadyMissedCache) {
				self.emit('error', new Error('tsify: no compiled file for ' + inputFile));
				return;
			}
			self.generateCache([inputFile]);
			if (self.host.error)
				return;
			return self.getCompiledFile(inputFile, true);
		}

		if (self.opts.inlineSourceMap) {
			output = self.setSourcePathInSourcemap(output, inputFile);
		}
		return output;
	};

	setSourcePathInSourcemap = function (output, inputFile) {
		var self = this;
		var normalized = path.relative(
			self.bopts.basedir || currentDirectory,
			inputFile
		);

		var sourcemap = fromComment(output);
		sourcemap.setProperty('sources', [normalized]);
		return output.replace(commentRegex, sourcemap.toComment());
	}
}


// 	var result = Tsifier;
// 	result.isTypescript = isTypescript;
// 	result.isTypescriptDeclaration = isTypescriptDeclaration;
// 	return result;
// };


/* -------------------------------------------------------------------------- */
/*                                    tsify                                   */
/* -------------------------------------------------------------------------- */

function tsify(b, opts) {

	if (typeof b === 'string') {
		throw new Error('tsify appears to have been configured as a transform; it must be configured as a plugin.');
	}

	var ts = opts.typescript || require('typescript');
	
	var tsifier = new Tsifier(opts, b._options);

	tsifier.on('error', function (error) {
		b.pipeline.emit('error', error);
	});
	tsifier.on('file', function (file, id) {
		b.emit('file', file, id);
	});

	setupPipeline();

	var transformOpts = {
		global: opts.global
	};
	b.transform(tsifier.transform.bind(tsifier), transformOpts);

	b.on('reset', function () {
		setupPipeline();
	});

	function setupPipeline() {
		if (tsifier.opts.jsx && b._extensions.indexOf('.tsx') === -1)
			b._extensions.unshift('.tsx');

		if (b._extensions.indexOf('.ts') === -1)
			b._extensions.unshift('.ts');

		b.pipeline.get('record').push(gatherEntryPoints());
	}

	function gatherEntryPoints() {
		var rows = [];
		return through.obj(transform, flush);

		function transform(row, enc, next) {
			rows.push(row);
			next();
		}

		function flush(next) {
			var self = this;
			var ignoredFiles = [];
			var entryFiles = rows
				.map(function (row) {
					var file = row.file || row.id;
					if (file) {
						if (row.source !== undefined) {
							ignoredFiles.push(file);
						} else if (row.basedir) {
							return path.resolve(row.basedir, file);
						} else if (path.isAbsolute(file)) {
							return file;
						} else {
							ignoredFiles.push(file);
						}
					}
					return null;
				})
				.filter(function (file) { return file; })
				.map(function (file) { return fs.realpathSync(file); });
			if (entryFiles.length) {
				log('Files from browserify entry points:');
				entryFiles.forEach(function (file) { log('  %s', file); });
			}
			if (ignoredFiles.length) {
				log('Ignored browserify entry points:');
				ignoredFiles.forEach(function (file) { log('  %s', file); });
			}
			tsifier.reset();
			tsifier.generateCache(entryFiles, ignoredFiles);
			rows.forEach(function (row) { self.push(row); });
			self.push(null);
			next();
		}
	}
}

export {tsify}
