var test = require('tape');

var ansidiff = require('ansidiff');
var browserify = require('browserify');
var es = require('event-stream');
var fs = require('fs');
var Q = require('q');

test('no arguments', function (t) {
	runTest(t, {}, {}, 'test/expected.js');
});
test('--sourcemap', function (t) {
	runTest(t, { sourcemap: true }, { debug: true }, 'test/expectedSourcemap.js');
});

function runTest(t, tsifyOptions, bundleOptions, expectedFile) {
	t.plan(1);

	var expectedDefer = Q.defer();
	var actualDefer = Q.defer();

	fs.readFile(expectedFile, function (err, data) { expectedDefer.resolve(data.toString()); });
	browserify({ extensions: ['.ts'] })
		.add('./test/x.ts')
		.plugin('./index.js', tsifyOptions)
		.bundle(bundleOptions)
		.pipe(es.wait(function (err, data) { actualDefer.resolve(data); }));

	Q.all([expectedDefer.promise, actualDefer.promise])
		.spread(function (expected, actual) {
			actual = actual.replace(/\r\n/g, '\n'); // fix CRLFs on Windows; the expected output uses LFs
			if (expected === actual) {
				t.pass('Test passed');
			} else {
				console.log(ansidiff.lines(expected, actual));
				t.fail('Test failed');
			}
		});
}
