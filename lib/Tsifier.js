var convert = require('convert-source-map');
var events  = require('events');
var log     = require('debuglog')(require('../package').name);
var path    = require('path');
var through = require('through2');
var time    = require('./time');
var util    = require('util');
var _       = require('lodash');

module.exports = function (ts) {
	var CompileError = require('./CompileError')(ts);
	var Host         = require('./Host')(ts);

	function isTypescript(file) {
		return (/\.tsx?$/i).test(file);
	}

	function isTypescriptDeclaration(file) {
		return (/\.d\.ts$/i).test(file);
	}

	function tsToJs(tsFile) {
		return tsFile.replace(/\.ts$/i, '.js');
	}

	function getRelativeFilename(file) {
		return './' + path.relative(process.cwd(), file)
			.replace(/\\/g, '/');
	}

	function parseOptions(opts) {
		var configFile = ts.findConfigFile(process.cwd());
		if (configFile) {
			var configFileContents = require(path.join(process.cwd(), configFile));
			opts = _.extend(configFileContents.compilerOptions, opts);
		}

		var parsed = ts.parseConfigFile({
			compilerOptions: opts || {},
			files: []
		}, null, '');

		// Always generate sourcemaps; browserify will only use these if --debug is set
		parsed.options.sourceMap = true;

		// Use CommonJS module mode unless we are in ES6 mode (where it is invalid)
		parsed.options.module = parsed.options.target === ts.ScriptTarget.ES6 ?
			ts.ModuleKind.None :
			ts.ModuleKind.CommonJS;

		// Blacklist --out and --outDir; these options are irrelevant because files are written to
		// tsify's in-memory cache instead of the filesystem
		delete parsed.options.out;
		delete parsed.options.outDir;

		return parsed.options;
	}

	function Tsifier(opts) {
		var self = this;

		self.opts = parseOptions(opts);
		self.host = new Host(process.cwd(), this.opts.target);

		self.host.on('file', function (file, id) {
			self.emit('file', file, id);
		});
	}

	util.inherits(Tsifier, events.EventEmitter);

	Tsifier.prototype.reset = function () {
		this.host._reset();
	};

	Tsifier.prototype.generateCache = function (files) {
		var tsFiles = files.filter(isTypescript)
			.map(getRelativeFilename);
		if (tsFiles.length === 0)
			return;

		this.addAll(tsFiles);
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
		var rootFilenames = _(self.host.files).filter('root').map('filename').valueOf();

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

		if (!isTypescript(file))
			return through();

		if (isTypescriptDeclaration(file))
			return through(transform);

		return through(transform, flush);

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

	Tsifier.prototype.getCompiledFile = function (tsFile) {
		var self = this;

		var normalized = ts.normalizePath(tsFile);
		var jsFile = tsToJs(normalized);

		var output = self.host.output[jsFile];
		if (!output) {
			log('Cache miss on %s', normalized);
			self.generateCache([tsFile]);
			if (self.host.error)
				return;
			output = self.host.output[jsFile];
			if (!output)
				return;
		}

		var sourcemap = convert.fromJSON(this.host.output[jsFile + '.map']);
		sourcemap.setProperty('sources', [normalized]);
		sourcemap.setProperty('sourcesContent', [self.host.files[normalized].contents]);
		return output.replace(convert.mapFileCommentRegex, sourcemap.toComment());
	};

	var result = Tsifier;
	result.isTypescript = isTypescript;
	result.isTypescriptDeclaration = isTypescriptDeclaration;
	return result;
};
