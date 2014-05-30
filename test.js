var ansidiff = require('ansidiff');
var browserify = require('browserify');
var es = require('event-stream');
var fs = require('fs');
var Q = require('q');

var expectedDefer = Q.defer();
var actualDefer = Q.defer();

fs.readFile('test/expected.js', function (err, data) { expectedDefer.resolve(data.toString()); });
browserify({ extensions: ['.ts'] })
	.add('./test/x.ts')
	.plugin('./index.js')
	.bundle()
	.pipe(es.wait(function (err, data) { actualDefer.resolve(data); }));

Q.all([expectedDefer.promise, actualDefer.promise])
	.spread(function (expected, actual) {
		if (expected === actual) {
			console.log('TEST PASSED');
			process.exit(0);
		} else {
			console.log('TEST FAILED');
			console.log(ansidiff.lines(expected, actual));
			process.exit(1);
		}
	});