var convert = require('convert-source-map');
var extend  = require('util-extend');
var path    = require('path');
var through = require('through');
var ts      = require('ts-compiler');

var CompileError = require('./CompileError');

function isTypescript(file) {
	return (/\.ts$/i).test(file);
}

function Tsifier(browserify, opts) {
	opts = opts || {};
	this.browserify = browserify;
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

Tsifier.prototype.compileAndCacheFiles = function () {
	var self = this;
	var files = self.browserify._entries;
	ts.compile(files, extend({}, self.opts), function (error, results) {
		if (error) self.browserify.emit('error', new CompileError(error));
		self.tscCache = {};
		if (results) {
			results.forEach(function (result) { self.tscCache[result.name] = result.text; });
		}
	});
};

Tsifier.prototype.transform = function (file) {
	if (!isTypescript(file)) return through();
	
	var self = this;
	var data = '';
	var stream = through(write, end);
	return stream;

	function write(buf) { data += buf; }
	function end() {
		var jsFile = self.getCompiledFileFromCache(file, data);
		if (!jsFile) {
			b.emit('error', new Error('File not compiled: ' + file));
			stream.queue(null);
		}
		else {
			stream.queue(jsFile);
			stream.queue(null);
		}
	}
};

Tsifier.prototype.getCompiledFileFromCache = function (tsFile, tsSource) {
	var jsFile = tsFile.replace(/\.ts$/i, '.js').replace(/\\/g, '/');
	var jsSource = this.tscCache[jsFile];
	if (!jsSource) return null;
	jsSource = this.inlineSourcemapFile(jsFile, jsSource, tsSource);
	return jsSource;
};

Tsifier.prototype.inlineSourcemapFile = function (jsFile, jsSource, tsSource) {
	var mapFileComment = convert.mapFileCommentRegex.exec(jsSource);
	if (!mapFileComment) return jsSource;

	var mapFile = path.resolve(path.dirname(jsFile), mapFileComment[1]).replace(/\\/g, '/');
	var mapSource = this.tscCache[mapFile];
	if (!mapSource) return jsSource;

	var mapObject = convert.fromJSON(mapSource);
	mapObject.sourcemap.sourcesContent = [tsSource];
	var mapComment = mapObject.toComment();
	return jsSource.replace(convert.mapFileCommentRegex, mapComment);
};

module.exports = Tsifier;
