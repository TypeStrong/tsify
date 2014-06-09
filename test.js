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

	browserify({ entries: ['./test/x.ts'] })
		.plugin('./index.js')
		.bundle()
		.pipe(es.wait(function (err, actual) {
			expectCompiledOutput(t, expected, actual);
		}));
});

test('non-TS main file', function (t) {
	t.plan(1);

	var expected = fs.readFileSync('test/expected.js').toString();

	browserify({ entries: ['./test/x.js'] })
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

	browserify({ entries: ['./test/x.ts'] })
		.plugin('./index.js')
		.bundle({ debug: true })
		.pipe(es.wait(function (err, actual) {
			expectCompiledOutput(t, expected, actual);
		}));
});

test('syntax error', function (t) {
	t.plan(4);

	var allErrors = [];
	browserify({ entries: ['./test/syntaxError.ts'] })
		.plugin('./index.js')
		.on('error', function (error) {
			allErrors.push(error);
		})
		.bundle()
		.pipe(es.wait(function () {
			t.equal(allErrors.length, 4, 'Should have 4 errors in total');
			t.equal(allErrors[0].name, 'TS1005', 'Should have syntax error on first import');
			t.equal(allErrors[1].name, 'TS1005', 'Should have syntax error on second import');
			t.ok(/^Compilation error/.test(allErrors[3].message), 'Should have compilation error message for entire file');
		}));
});

test('type error', function (t) {
	t.plan(4);

	var allErrors = [];
	browserify({ entries: ['./test/typeError.ts'] })
		.plugin('./index.js')
		.on('error', function (error) {
			allErrors.push(error);
		})
		.bundle()
		.pipe(es.wait(function () {
			t.equal(allErrors.length, 4, 'Should have 4 errors in total');
			t.equal(allErrors[0].name, 'TS2082', 'Should have "Supplied parameters do not match any call signature of target" error');
			t.equal(allErrors[1].name, 'TS2087', 'Should have "Could not select overload for call expression" error');
			t.ok(/^Compilation error/.test(allErrors[3].message), 'Should have compilation error message for entire file');
		}));
});

function expectCompiledOutput(t, expected, actual) {
	actual = actual.replace(/\r\n/g, '\n'); // fix CRLFs on Windows; the expected output uses LFs
	if (expected === actual) {
		t.pass('Compiled output should match expected output');
	} else {
		console.log(ansidiff.lines(expected, actual));
		t.fail('Compiled output should match expected output');
	}
}

function fixPreludePathInSourcemap(contents) {
	var sourcemap = convert.fromSource(contents);
	var sources = sourcemap.getProperty('sources');
	sources[0] = path.resolve(__dirname, 'node_modules/browserify/node_modules/browser-pack/_prelude.js');
	sourcemap.setProperty('sources', sources);
	return contents.replace(convert.commentRegex, sourcemap.toComment());
}
