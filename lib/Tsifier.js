var convert = require('convert-source-map');
var events  = require('events');
var log     = require('debuglog')(require('../package').name);
var path    = require('path');
var glob = require('glob');
var through = require('through2');
var time    = require('./time');
var util    = require('util');
var _       = require('lodash');
var fs = require('fs');

var CompileError = require('./CompileError');
var Host         = require('./Host');
var ts           = require('./tsc/tsc');

function isTypescript(file) {
	return !isTypescriptDeclaration(file) && (/\.ts$/i).test(file);
}

function isTypescriptDeclaration(file) {
	return (/\.d\.ts$/i).test(file);
}

function tsToJs(tsFile) {
	return tsFile.replace(/\.ts$/i, '.js');
}

function tsToDts(tsFile) {
	return tsFile.replace(/\.ts$/i, '.d.ts');
}

function getAbsoluteFilename(file) {
	return path.resolve(file);
}

function unixStylePath(filePath) {
	return filePath.split(path.sep).join('/');
}

function Tsifier(opts) {
	opts = opts || {};
    this.sourceRoot = opts.sourceRoot || './',
	this.opts = {
		module: 'commonjs',
		noImplicitAny: opts.noImplicitAny || false,
		removeComments: opts.removeComments || false,
		declaration: Boolean(opts.declarationOutput),
		declarationFiles: opts.declarationFiles || '',
		declarationOutput: opts.declarationOutput || '',
		sourceMap: true,
		noExternalResolve: opts.noExternalResolve || false,
		target: ts.ScriptTarget[opts.target || opts.t || 'ES3'],
		skipWrite: true
	};
	this.host = new Host(process.cwd(), this.opts.target, !this.opts.noExternalResolve);
}

util.inherits(Tsifier, events.EventEmitter);

Tsifier.prototype.reset = function () {
	this.host._reset();
	this.declarationContent = '';
};

Tsifier.prototype.generateCache = function (files) {
	var tsFiles = files.filter(isTypescript)
		.map(getAbsoluteFilename);
	if (tsFiles.length === 0)
		return;

	var self = this;
	glob(self.opts.declarationFiles, {}, function (error, files) {
		var dtsFiles = files.filter(isTypescriptDeclaration)
			.map(getAbsoluteFilename);
		dtsFiles.forEach(function (file) {
			self.host._addFile(file, true);
		});

		self.addAll(tsFiles);
		self.compile();
	});
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

	var diagnostics_t0 = time.start();
	var errors = program.getDiagnostics();
	if (!errors.length) {
		var checker = program.getTypeChecker(true);
		var semanticErrors = checker.getDiagnostics();
		var emitErrors = checker.emitFiles().errors;
		errors = semanticErrors.concat(emitErrors);
	}
	time.stop(diagnostics_t0, 'diagnostic checking');

	errors = errors.filter(function (e) { return e; });
	errors.forEach(function (error) {
		self.emit('error', new CompileError(error));
	});

	if (errors.length)
		self.host.error = true;
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
		var compiled = self.getCompiledFile(getAbsoluteFilename(file));
		if (compiled) {
			this.push(compiled);
		}
		this.push(null);
		next();
	}
};

Tsifier.prototype.getCompiledFile = function (tsFile) {
	var self = this;

	if (self.host.error)
		return;

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
	sourcemap.setProperty('sources', [path.relative(path.resolve(process.cwd(), this.sourceRoot), normalized)]);
	sourcemap.setProperty('sourcesContent', [self.host.files[normalized].contents]);
	return output.replace(convert.mapFileCommentRegex, sourcemap.toComment());
};

Tsifier.prototype.emitDeclaration = function (tsFile) {
	var self = this;

	if (self.host.error)
		return;

	var normalized = ts.normalizePath(tsFile);
	var dtsFile = tsToDts(normalized);

	var output = self.host.output[dtsFile];
	if (!output) {
		log('Cache miss on %s', normalized);
		self.generateCache([dtsFile]);
		if (self.host.error)
			return;
		output = self.host.output[dtsFile];
		if (!output)
			return;
	}

	self.declarationContent += 'declare module "' + unixStylePath(path.relative('../', dtsFile.slice(0,-5))) + '" {\n\t'
	self.declarationContent += output.split('declare ').join('').split('\n').join('\n\t') + "\n"
	self.declarationContent += '}';
}

Tsifier.prototype.emitFiles = function () {
	var self = this;

	_.keys(self.host.files).forEach(function (file) {
		if (isTypescript(file)) {
			if (self.opts.declarationOutput)
				self.emitDeclaration(file);
			self.emit('file', path.resolve(file));
		}
	});

	if (self.opts.declarationOutput) {
		fs.writeFile(self.opts.declarationOutput, self.declarationContent, function(err) {
			if (err)
				throw err;
		});
	}
};

module.exports = Tsifier;
module.exports.isTypescript = isTypescript;
module.exports.isTypescriptDeclaration = isTypescriptDeclaration;
