var convert = require('convert-source-map');
var events  = require('events');
var extend  = require('util-extend');
var path    = require('path');
var through = require('through');
var ts      = require('ts-compiler');
var util    = require('util');

var CompileError = require('./CompileError');

var COMPILE_ERROR_SENTINEL = {};

function isTypescript(file) {
	return (/\.ts$/i).test(file);
}

function jsFileForTsFile(tsFile) {
	return tsFile.replace(/\.ts$/i, '.js').replace(/\\/g, '/');
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
	this.tscCache = null;
}

util.inherits(Tsifier, events.EventEmitter);

Tsifier.prototype.clearCompilationCache = function () {
	this.tscCache = {};
};

Tsifier.prototype.transform = function (file) {
	if (!isTypescript(file)) return through();
	
	var self = this;
	var data = '';
	var stream = through(write, end);
	return stream;

	function write(buf) { data += buf; }
	function end() {
		var jsFile = self.getCompiledFile(file, data);
		if (jsFile)
			stream.queue(jsFile);
		stream.queue(null);
	}
};

Tsifier.prototype.getCompiledFile = function (tsFile, tsSource) {
	var jsFile = jsFileForTsFile(tsFile);

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
		self.tscCache = {};
		if (results) {
			results.forEach(function (result) { self.tscCache[result.name] = result.text; });
		} else {
			tsFiles.forEach(function (tsFile) {
				self.tscCache[jsFileForTsFile(tsFile)] = COMPILE_ERROR_SENTINEL;
			});
		}
	});
};

Tsifier.prototype.inlineSourcemapFile = function (jsFile, tsFile, jsSource, tsSource) {
	var mapFileComment = convert.mapFileCommentRegex.exec(jsSource);
	if (!mapFileComment) return jsSource;

	var mapFile = path.resolve(path.dirname(jsFile), mapFileComment[1]).replace(/\\/g, '/');
	var mapSource = this.tscCache[mapFile];
	if (!mapSource) return jsSource;

	var mapObject = convert.fromJSON(mapSource);
	mapObject.setProperty('sources', [tsFile]);
	mapObject.setProperty('sourcesContent', [tsSource]);
	var mapComment = mapObject.toComment();
	return jsSource.replace(convert.mapFileCommentRegex, mapComment);
};

module.exports = Tsifier;
module.exports.isTypescript = isTypescript;
