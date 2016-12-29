'use strict';

var convert  = require('convert-source-map');
var events   = require('events');
var extend   = require('util')._extend;
var fs       = require('fs');
var realpath = require('fs.realpath');
var log      = require('util').debuglog(require('../package').name);
var trace    = require('util').debuglog(require('../package').name + '-trace');
var path     = require('path');
var through  = require('through2');
var time     = require('./time');
var tsconfig = require('tsconfig');
var util     = require('util');
var assign   = require('object-assign');

module.exports = function (ts) {
	var CompileError     = require('./CompileError')(ts);
	var Host             = require('./Host')(ts);
	var currentDirectory = ts.normalizeSlashes(realpath.realpathSync(process.cwd()));

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

	function fileExists(file) {
		try {
			var stats = fs.lstatSync(file);
			return stats.isFile();
		} catch (e) {
			return false;
		}
	}

	function parseOptions(opts, bopts) {

		// Expand any short-name, command-line options
		var expanded = {};
		if (opts.m) { expanded.module = opts.m; }
		if (opts.p) { expanded.project = opts.p; }
		if (opts.t) { expanded.target = opts.t; }
		opts = assign(expanded, opts);

		var config;
		var configFile;
		if (typeof opts.project === "object"){
			log('Using inline tsconfig');
			config = JSON.parse(JSON.stringify(opts.project));
			config.compilerOptions = config.compilerOptions || {};
			extend(config.compilerOptions, opts);
		} else {
			if (fileExists(opts.project)) {
				configFile = opts.project;
			} else {
				configFile = ts.findConfigFile(
					ts.normalizeSlashes(opts.project || bopts.basedir || currentDirectory),
					fileExists
				);
			}
			if (configFile) {
				log('Using tsconfig file at %s', configFile);
				config = tsconfig.readFileSync(configFile);
				config.compilerOptions = config.compilerOptions || {};
				extend(config.compilerOptions, opts);
			} else {
				config = {
					files: [],
					compilerOptions: opts
				};
			}
		}

		var parsed = parseJsonConfigFileContent(
			config,
			ts.sys,
			configFile ? ts.normalizeSlashes(path.resolve(path.dirname(configFile))) : currentDirectory,
			null,
			configFile ? ts.normalizeSlashes(path.resolve(configFile)) : undefined
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
		parsed.options.outDir = ts.normalizeSlashes(path.resolve('/__tsify__'));

		log('Files from tsconfig parse:');
		parsed.fileNames.forEach(function (filename) { log('  %s', filename); });

		var result = {
			options: parsed.options,
			fileNames: parsed.fileNames
		};

		return result;
	}

	function Tsifier(opts, bopts) {
		var self = this;

		var parsedOptions = parseOptions(opts, bopts);
		self.opts = parsedOptions.options;
		self.files = parsedOptions.fileNames;
		self.ignoredFiles = [];
		self.bopts = bopts;
		self.host = new Host(currentDirectory, self.opts);

		self.host.on('file', function (file, id) {
			self.emit('file', file, id);
		});
	}

	util.inherits(Tsifier, events.EventEmitter);

	Tsifier.prototype.reset = function () {
		var self = this;
		self.ignoredFiles = [];
		self.host._reset();
		self.addFiles(self.files);
	};

	Tsifier.prototype.generateCache = function (files, ignoredFiles) {
		if (ignoredFiles) {
			this.ignoredFiles = ignoredFiles;
		}
		this.addFiles(files);
		this.compile();
	};

	Tsifier.prototype.addFiles = function (files) {
		var self = this;
		files.forEach(function (file) {
			self.host._addFile(file, true);
		});
	};

	Tsifier.prototype.compile = function () {
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
			if (self.host.error)
				return;

			var compiled = self.getCompiledFile(file);
			if (compiled) {
				this.push(compiled);
			}
			this.push(null);
			next();
		}
	};

	Tsifier.prototype.getCompiledFile = function (inputFile, alreadyMissedCache) {
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

	Tsifier.prototype.setSourcePathInSourcemap = function (output, inputFile) {
		var self = this;
		var normalized = ts.normalizePath(path.relative(
			self.bopts.basedir || currentDirectory,
			inputFile
		));

		var sourcemap = convert.fromComment(output);
		sourcemap.setProperty('sources', [normalized]);
		return output.replace(convert.commentRegex, sourcemap.toComment());
	}

	var result = Tsifier;
	result.isTypescript = isTypescript;
	result.isTypescriptDeclaration = isTypescriptDeclaration;
	return result;
};
