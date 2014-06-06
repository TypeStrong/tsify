var test = require('tape');

var ansidiff = require('ansidiff');
var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var fs = require('fs');
var path = require('path');
var Q = require('q');

test('no arguments', function (t) {
	var expected = fs.readFileSync('test/expected.js').toString();
	runTest(t, {}, {}, expected);
});
test('--sourcemap', function (t) {
	var expected = fs.readFileSync('test/expectedSourcemap.js').toString();
	var sourcemap = convert.fromSource(expected);
	var sources = sourcemap.getProperty('sources');
	sources[0] = path.resolve(__dirname, 'node_modules/browserify/node_modules/browser-pack/_prelude.js');
	sourcemap.setProperty('sources', sources);
	expected = expected.replace(convert.commentRegex, sourcemap.toComment());
	runTest(t, { sourcemap: true }, { debug: true }, expected);
});

function runTest(t, tsifyOptions, bundleOptions, expected) {
	t.plan(1);

	var actualDefer = Q.defer();
	browserify({ extensions: ['.ts'] })
		.add('./test/x.ts')
		.plugin('./index.js', tsifyOptions)
		.bundle(bundleOptions)
		.pipe(es.wait(function (err, actual) { 
			actual = actual.replace(/\r\n/g, '\n'); // fix CRLFs on Windows; the expected output uses LFs
			if (expected === actual) {
				t.pass('Test passed');
			} else {
				console.log(ansidiff.lines(expected, actual));
				t.fail('Test failed');
			}
		}));
}
