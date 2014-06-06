var test = require('tape');

var ansidiff = require('ansidiff');
var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var fs = require('fs');
var path = require('path');

test('no arguments', function (t) {
	t.plan(1);

	var expected = fs.readFileSync('test/expected.js').toString();

	browserify({ extensions: ['.ts'], entries: ['./test/x.ts'] })
		.plugin('./index.js')
		.bundle()
		.pipe(es.wait(function (err, actual) {
			expectCompiledOutput(t, expected, actual);
		}));
});

test('--sourcemap', function (t) {
	t.plan(1);

	var expected = fs.readFileSync('test/expectedSourcemap.js').toString();
	expected = fixPreludePathInSourcemap(expected);

	browserify({ extensions: ['.ts'], entries: ['./test/x.ts'] })
		.plugin('./index.js')
		.bundle({ debug: true })
		.pipe(es.wait(function (err, actual) {
			expectCompiledOutput(t, expected, actual);
		}));
});

test('syntax error', function (t) {
	t.plan(4);

	var allErrors = [];
	browserify({ extensions: ['.ts'], entries: ['./test/syntaxError.ts'] })
		.plugin('./index.js')
		.on('error', function (error) {
			allErrors.push(error);
		})
		.bundle()
		.pipe(es.wait(function () {
			t.equal(allErrors.length, 4);
			t.equal(allErrors[0].name, 'TS1005');
			t.equal(allErrors[1].name, 'TS1005');
			t.ok(/^File not compiled/.test(allErrors[3].message));
		}));
});

test('type error', function (t) {
	t.plan(4);

	var allErrors = [];
	browserify({ extensions: ['.ts'], entries: ['./test/typeError.ts'] })
		.plugin('./index.js')
		.on('error', function (error) {
			allErrors.push(error);
		})
		.bundle()
		.pipe(es.wait(function () {
			t.equal(allErrors.length, 4);
			t.equal(allErrors[0].name, 'TS2082');
			t.equal(allErrors[1].name, 'TS2087');
			t.ok(/^File not compiled/.test(allErrors[3].message));
		}));
});

function expectCompiledOutput(t, expected, actual) {
	actual = actual.replace(/\r\n/g, '\n'); // fix CRLFs on Windows; the expected output uses LFs
	if (expected === actual) {
		t.pass('Test passed');
	} else {
		console.log(ansidiff.lines(expected, actual));
		t.fail('Test failed');
	}
}

function fixPreludePathInSourcemap(contents) {
	var sourcemap = convert.fromSource(contents);
	var sources = sourcemap.getProperty('sources');
	sources[0] = path.resolve(__dirname, 'node_modules/browserify/node_modules/browser-pack/_prelude.js');
	sourcemap.setProperty('sources', sources);
	return contents.replace(convert.commentRegex, sourcemap.toComment());
}
