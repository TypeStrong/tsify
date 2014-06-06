var convert = require('convert-source-map');
var extend  = require('util-extend');
var path    = require('path');
var through = require('through');
var ts      = require('ts-compiler');

function isTypescript(file) {
	return (/\.ts$/i).test(file);
}

function tsify(b, opts) {
	var tscCache;
	opts = opts || {};
	opts = {
		module: 'commonjs',
		noImplicitAny: opts.noImplicitAny || false,
		removeComments: opts.removeComments || false,
		sourcemap: true,
		target: opts.target || opts.t || 'ES3',
		skipWrite: true
	};

	b.on('bundle', function () {
		var files = b._entries;
		var tscOpts = {};
		extend(tscOpts, opts);
		ts.compile(files, tscOpts, function (error, results) {
			if (error) b.emit('error', new CompileError(error));
			tscCache = {};
			if (results) {
				results.forEach(function (result) { tscCache[result.name] = result.text; });
			}
		});
	});
	b.transform(function (file) {
		if (!isTypescript(file)) return through();
		var data = '';
		var stream = through(write, end);
		return stream;

		function write(buf) { data += buf; }
		function end() {
			var jsFile = getCompiledFileFromCache(file, data);
			if (!jsFile) {
				b.emit('error', new Error('File not compiled: ' + file));
				stream.queue(null);
			}
			else {
				stream.queue(jsFile);
				stream.queue(null);
			}
		};
	});

	function getCompiledFileFromCache(tsFile, tsSource) {
		var jsFile = tsFile.replace(/\.ts$/i, '.js').replace(/\\/g, '/');
		var jsSource = tscCache[jsFile];
		if (!jsSource) return null;
		jsSource = inlineSourcemapFile(jsFile, jsSource, tsSource);
		return jsSource;
	}

	function inlineSourcemapFile(jsFile, jsSource, tsSource) {
		var mapFileComment = convert.mapFileCommentRegex.exec(jsSource);
		if (!mapFileComment) return jsSource;

		var mapFile = path.resolve(path.dirname(jsFile), mapFileComment[1]).replace(/\\/g, '/');
		var mapSource = tscCache[mapFile];
		if (!mapSource) return jsSource;

		var mapObject = convert.fromJSON(mapSource);
		mapObject.sourcemap.sourcesContent = [tsSource];
		var mapComment = mapObject.toComment();
		return jsSource.replace(convert.mapFileCommentRegex, mapComment);
	}
}


function CompileError(fullMessage) {
    SyntaxError.call(this);
    var errorMessageRegex = /(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/;
    var results = errorMessageRegex.exec(fullMessage);
    if (!results) {
    	this.message = fullMessage;
    } else {
    	this.fileName = results[1];
    	this.line = results[2];
    	this.column = results[3];
    	this.name = results[4];
    	this.message = results[5];
    }
}
CompileError.prototype = Object.create(SyntaxError.prototype);

module.exports = tsify;
