var path    = require('path');
var through = require('through');
var ts      = require('ts-compiler');

function isTypescript(file) {
	return (/\.ts$/i).test(file);
}

function sourceFromResult(file) {
	return path.normalize(file).replace(/\.js$/i, '.ts');
}

function typescriptify(b, opts) {
	var tsResults;
	opts = opts || {};
	opts.skipWrite = true;
	opts.module = 'commonjs';

	b.on('bundle', function () {
		var files = b._entries;
		ts.compile(files, opts, function (error, results) {
			if (error) b.emit('error', new CompileError(error));
			tsResults = {};
			if (results) {
				results.forEach(function (result) {
					tsResults[sourceFromResult(result.name)] = result.text;
				});
			}
		});
	});
	b.transform(function (file) {
		if (!isTypescript(file)) return through();
		var stream = through(write, end);
		return stream;

		function write() { }
		function end() {
			if (!tsResults[file]) {
				b.emit('error', new Error('File not compiled: ' + file));
				stream.queue(null);
			}
			else {
				stream.queue(tsResults[file]);
				stream.queue(null);
			}
		};
	})
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

module.exports = typescriptify;