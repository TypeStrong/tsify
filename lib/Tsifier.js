var convert = require('convert-source-map');
var events  = require('events');
var extend  = require('util-extend');
var path    = require('path');
var through = require('through2');
var ts      = require('ts-compiler');
var util    = require('util');

var CompileError = require('./CompileError');

var COMPILE_ERROR_SENTINEL = {};

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

function Tsifier(opts) {
	opts = opts || {};
	this.opts = {
		module: 'commonjs',
		noImplicitAny: opts.noImplicitAny || false,
		removeComments: opts.removeComments || false,
		sourcemap: true,
		target: opts.target || opts.t || 'ES3',
		skipWrite: true
	};
	this.tscCache = {};
}

util.inherits(Tsifier, events.EventEmitter);

Tsifier.prototype.clearCompilationCache = function () {
	this.tscCache = {};
};

Tsifier.prototype.transform = function (file) {
	if (!isTypescript(file)) return through();

	file = getRelativeFilename(file);

	var self = this;
	var data = '';
	return through(transform, flush);

	function transform(chunk, enc, next) {
		data += chunk;
		next();
	}
	function flush(next) {
		var jsFile = self.getCompiledFile(file, data);
		if (jsFile)
			this.push(jsFile);
		this.push(null);
		next();
	}
};

Tsifier.prototype.getCompiledFile = function (tsFile, tsSource) {
	var jsFile = tsToJs(tsFile);

	var jsSource = this.tscCache[jsFile];
	if (!jsSource) {
		this.compileAndCacheFiles([tsFile]);
		jsSource = this.tscCache[jsFile];
	}

	if (!jsSource) {
		this.emit('error', new Error('File missing from compilation cache: ' + jsFile));
		return null;
	}
	if (jsSource === COMPILE_ERROR_SENTINEL) {
		this.emit('error', new Error('Compilation error for: ' + jsFile));
		return null;
	}
	jsSource = this.inlineSourcemapFile(jsFile, tsFile, jsSource, tsSource);
	return jsSource;
};

Tsifier.prototype.compileAndCacheFiles = function (files) {
	var self = this;

	var tsFiles = files.filter(isTypescript);
	if (tsFiles.length === 0) return;

	ts.compile(tsFiles, extend({}, self.opts), function (error, results) {
		if (error) self.emit('error', new CompileError(error));
		if (results) {
			results.forEach(function (result) {
				self.tscCache[getRelativeFilename(result.name)] = result.text;
			});
		} else {
			tsFiles.forEach(function (tsFile) {
				self.tscCache[tsToJs(tsFile)] = COMPILE_ERROR_SENTINEL;
			});
		}
	});
};

Tsifier.prototype.inlineSourcemapFile = function (jsFile, tsFile, jsSource, tsSource) {
	var mapFile = jsFile + '.map';

	var mapSource = this.tscCache[mapFile];
	if (!mapSource) return jsSource;

	var mapObject = convert.fromJSON(mapSource);
	if (!mapObject) return jsSource;

	mapObject.setProperty('sources', [path.relative('.', tsFile)]);
	mapObject.setProperty('sourcesContent', [tsSource]);
	var mapComment = mapObject.toComment();
	return jsSource.replace(convert.mapFileCommentRegex, mapComment);
};

module.exports = Tsifier;
module.exports.isTypescript = isTypescript;
module.exports.isTypescriptDeclaration = isTypescriptDeclaration;
