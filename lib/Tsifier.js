var convert = require('convert-source-map');
var events  = require('events');
var log     = require('debuglog')(require('../package').name);
var path    = require('path');
var through = require('through2');
var time    = require('./time');
var util    = require('util');
var _       = require('lodash');

var CompileError = require('./CompileError');
var Host         = require('./Host');
var ts           = require('typescript');

function isTypescript(file) {
	return (/\.ts$/i).test(file);
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
	opts = opts || {};

	// Allow either -t or --target
	opts.target = ts.ScriptTarget[opts.target || opts.t || 'ES3'];
	delete opts.t;

	// Always return sourcemaps from tsc; Browserify will only use them if --debug is set
	opts.sourceMap = true;

	// Use CommonJS module mode unless we are in ES6 mode (where it is invalid to set a module mode)
	if (opts.target === ts.ScriptTarget.ES6) {
		delete opts.module;
	} else {
		opts.module = 'commonjs';
	}

	// This is not an option for tsc
	var stopOnError = opts.stopOnError;
	delete opts.stopOnError;

	return { opts: opts, stopOnError: stopOnError };
}

function Tsifier(opts) {
	var parsedOpts = parseOptions(opts);
	this.opts = parsedOpts.opts;
	this.stopOnError = parsedOpts.stopOnError;
	this.host = new Host(process.cwd(), this.opts.target);
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
	if (syntaxDiagnostics.length)
		return;

	var semanticDiagnostics = self.checkSemantics(program);
	if (semanticDiagnostics.length && self.stopOnError)
		return;

	var emit_t0 = time.start();
	var emitOutput = program.emit();
	time.stop(emit_t0, 'emit program');

	var emittedDiagnostics = self.checkEmittedOutput(emitOutput);
	if (emittedDiagnostics.length && self.stopOnError)
		return;

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
}

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

	if (semanticDiagnostics.length && self.stopOnError) {
		self.host.error = true;
	}

	return semanticDiagnostics;
}

Tsifier.prototype.checkEmittedOutput = function (emitOutput) {
	var self = this;

	var emittedDiagnostics = emitOutput.diagnostics;
	emittedDiagnostics.forEach(function (error) {
		self.emit('error', new CompileError(error));
	});

	if (emittedDiagnostics.length && self.stopOnError) {
		self.host.error = true;
	}

	return emittedDiagnostics;
}

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

Tsifier.prototype.emitFiles = function () {
	var self = this;
	_.keys(self.host.files).forEach(function (file) {
		self.emit('file', path.resolve(file));
	});
};

module.exports = Tsifier;
module.exports.isTypescript = isTypescript;
module.exports.isTypescriptDeclaration = isTypescriptDeclaration;
