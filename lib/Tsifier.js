var convert = require('convert-source-map');
var events  = require('events');
var extend  = require('util')._extend;
var fs      = require('fs');
var log     = require('debuglog')(require('../package').name);
var path    = require('path');
var through = require('through2');
var time    = require('./time');
var util    = require('util');

module.exports = function (ts) {
	var CompileError     = require('./CompileError')(ts);
	var Host             = require('./Host')(ts);
	var currentDirectory = fs.realpathSync(process.cwd()).replace(/\\/g, '/');

	var parseJsonConfigFileContent = ts.parseJsonConfigFileContent || ts.parseConfigFile;

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

	function getRelativeFilename(file) {
		return './' + path.relative(currentDirectory, file)
			.replace(/\\/g, '/');
	}

	function fileExists(file) {
		try {
			var stats = fs.lstatSync(file);
			return stats.isFile();
		} catch (e) {
			return false;
		}
	}

	function parseOptions(opts, bopts) {
		var configFile = ts.findConfigFile(currentDirectory, fileExists);
		if (configFile) {
			var configFileContents = require(path.resolve(currentDirectory, configFile));
			opts = extend(configFileContents.compilerOptions, opts);
		}

		var parsed = parseJsonConfigFileContent({
			compilerOptions: opts || {},
			files: []
		}, null, '');

		// Generate inline sourcemaps if Browserify's --debug option is set
		parsed.options.sourceMap = false;
		parsed.options.inlineSourceMap = bopts.debug;
		parsed.options.inlineSources = bopts.debug;

		// Default to CommonJS module mode
		parsed.options.module = parsed.options.module || ts.ModuleKind.CommonJS;

		// Blacklist --out/--outFile; these should definitely not be set, since we are doing
		// concatenation with Browserify instead
		delete parsed.options.out;
		delete parsed.options.outFile;

		// Set rootDir and outDir so we know exactly where the TS compiler will be trying to
		// write files; the filenames will end up being the keys into our in-memory store.
		// The output directory needs to be distinct from the input directory to prevent the TS
		// compiler from thinking that it might accidentally overwrite source files, which would
		// prevent it from outputting e.g. the results of transpiling ES6 JS files with --allowJs.
		parsed.options.rootDir = currentDirectory;
		parsed.options.outDir = '__tsify__';

		return parsed.options;

	}

	function Tsifier(opts, bopts) {
		var self = this;

		self.opts = parseOptions(opts, bopts);
		self.bopts = bopts;
		self.host = new Host(currentDirectory, this.opts.target);

		self.host.on('file', function (file, id) {
			self.emit('file', file, id);
		});
	}

	util.inherits(Tsifier, events.EventEmitter);

	Tsifier.prototype.reset = function () {
		this.host._reset();
	};

	Tsifier.prototype.generateCache = function (files) {
		this.addAll(files.map(getRelativeFilename));
		this.compile();
	};

	Tsifier.prototype.addAll = function (files) {
		var self = this;
		files.forEach(function (file) {
			self.host._addFile(file, true);
		});
	};

	Tsifier.prototype.compile = function () {
		var self = this;
		var rootFilenames = [];
		for (var filename in self.host.files) {
			if (!Object.hasOwnProperty.call(self.host.files, filename)) continue;
			if (!self.host.files[filename].root) continue;
			rootFilenames.push(filename);
		}

		log('Compiling files:');
		rootFilenames.forEach(function (file) { log('  %s', file); });

		var createProgram_t0 = time.start();
		var program = ts.createProgram(rootFilenames, self.opts, self.host);
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

	Tsifier.prototype.checkSyntax = function (program) {
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

	Tsifier.prototype.checkSemantics = function (program) {
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

	Tsifier.prototype.checkEmittedOutput = function (emitOutput) {
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

	Tsifier.prototype.transform = function (file) {
		var self = this;

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
			if (self.host.error)
				return;

			var compiled = self.getCompiledFile(getRelativeFilename(file));
			if (compiled) {
				this.push(compiled);
			}
			this.push(null);
			next();
		}
	};

	Tsifier.prototype.getCompiledFile = function (inputFile, alreadyMissedCache) {
		var self = this;
		var normalized = ts.normalizePath(inputFile);

		var outputExtension = (self.opts.jsx === ts.JsxEmit.Preserve && isTsx(inputFile)) ? '.jsx' : '.js';
		var outputFile = '__tsify__/' + replaceFileExtension(normalized, outputExtension);
		var output = self.host.output[outputFile];

		if (!output) {
			if (alreadyMissedCache)
				return;
			log('Cache miss on %s', normalized);
			self.generateCache([inputFile]);
			if (self.host.error)
				return;
			return self.getCompiledFile(inputFile, true);
		}

		if (self.opts.inlineSourceMap) {
			output = self.setFullSourcePathInSourcemap(output, normalized);
		}

		return output;
	};

	Tsifier.prototype.setFullSourcePathInSourcemap = function (output, normalized) {
		var self = this;
		if (self.bopts.basedir) {
			normalized = path.relative(self.bopts.basedir, normalized).replace(/\\/g, '/');
		}

		var sourcemap = convert.fromComment(output);
		sourcemap.setProperty('sources', [normalized]);
		return output.replace(convert.commentRegex, sourcemap.toComment());
	}

	var result = Tsifier;
	result.isTypescript = isTypescript;
	result.isTypescriptDeclaration = isTypescriptDeclaration;
	return result;
};
