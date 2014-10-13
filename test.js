var test = require('tape');

var ansidiff = require('ansidiff');
var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var fs = require('fs');
var path = require('path');

test('no arguments', function (t) {
	t.plan(8);
	expectSuccess(t,
		'./test/noArguments/x.ts',
		'./test/noArguments/expected.js');
});

test('non-TS main file', function (t) {
	t.plan(8);
	expectSuccess(t,
		'./test/withJsRoot/x.js',
		'./test/withJsRoot/expected.js');
});

test('with adjacent compiled files', function (t) {
	t.plan(8);
	expectSuccess(t,
		'./test/withAdjacentCompiledFiles/x.ts',
		'./test/withAdjacentCompiledFiles/expected.js');
});

test('with nested dependencies', function (t) {
	t.plan(8);
	expectSuccess(t,
		'./test/withNestedDeps/x.ts',
		'./test/withNestedDeps/expected.js');
});

test('syntax error', function (t) {
	t.plan(4);
	run('./test/syntaxError/x.ts', function (errors, actual) {
		t.equal(errors.length, 4, 'Should have 4 errors in total');
		t.equal(errors[0].name, 'TS1005', 'Should have syntax error on first import');
		t.equal(errors[1].name, 'TS1005', 'Should have syntax error on second import');
		t.ok(/^Compilation error/.test(errors[3].message), 'Should have compilation error message for entire file');
	});
});

test('type error', function (t) {
	t.plan(4);
	run('./test/typeError/x.ts', function (errors, actual) {
		t.equal(errors.length, 4, 'Should have 4 errors in total');
		t.equal(errors[0].name, 'TS2082', 'Should have "Supplied parameters do not match any call signature of target" error');
		t.equal(errors[1].name, 'TS2087', 'Should have "Could not select overload for call expression" error');
		t.ok(/^Compilation error/.test(errors[3].message), 'Should have compilation error message for entire file');
	});
});

test('multiple entry points', function (t) {
	t.plan(8);
	var expectedFile = './test/multipleEntryPoints/expected.js';
	var expected = fs.readFileSync(expectedFile).toString();
	var errors = [];
	browserify({ entries: ['./test/multipleEntryPoints/y.ts', './test/multipleEntryPoints/z.ts'], debug: true })
		.plugin('./index.js')
		.on('error', function (error) {
			errors.push(error);
		})
		.bundle()
		.pipe(es.wait(function (err, actual) {
			t.equal(errors.length, 0, 'Should have no compilation errors');
			expectCompiledOutput(t, expected, actual.toString(), path.dirname(expectedFile));
		}));
});

test('late added entries', function (t) {
	t.plan(8);
	var expectedFile = './test/noArguments/expected.js';
	var expected = fs.readFileSync(expectedFile).toString();
	var errors = [];
	browserify({ debug: true })
		.plugin('./index.js')
		.on('error', function (error) {
			errors.push(error);
		})
		.add('./test/noArguments/x.ts')
		.bundle()
		.pipe(es.wait(function (err, actual) {
			t.equal(errors.length, 0, 'Should have no compilation errors');
			expectCompiledOutput(t, expected, actual.toString(), path.dirname(expectedFile));
		}));
});

test('late added entries with multiple entry points', function (t) {
	t.plan(8);
	var expectedFile = './test/multipleEntryPoints/expected.js';
	var expected = fs.readFileSync(expectedFile).toString();
	var errors = [];
	browserify({ entries: ['./test/multipleEntryPoints/y.ts'], debug: true })
		.plugin('./index.js')
		.on('error', function (error) {
			errors.push(error);
		})
		.add('./test/multipleEntryPoints/z.ts')
		.bundle()
		.pipe(es.wait(function (err, actual) {
			t.equal(errors.length, 0, 'Should have no compilation errors');
			expectCompiledOutput(t, expected, actual.toString(), path.dirname(expectedFile));
		}));
});

test('including .d.ts file', function (t) {
	t.plan(8);
	var expectedFile = './test/declarationFile/expected.js';
	var expected = fs.readFileSync(expectedFile).toString();
	var errors = [];
	browserify({ entries: ['./test/declarationFile/x.ts', './test/declarationFile/interface.d.ts'], debug: true })
		.plugin('./index.js')
		.on('error', function (error) {
			errors.push(error);
		})
		.bundle()
		.pipe(es.wait(function (err, actual) {
			t.equal(errors.length, 0, 'Should have no compilation errors');
			expectCompiledOutput(t, expected, actual.toString(), path.dirname(expectedFile));
		}));
});

function expectSuccess(t, main, expectedFile) {
	var expected = fs.readFileSync(expectedFile).toString();
	run(main, function (errors, actual) {
		t.equal(errors.length, 0, 'Should have no compilation errors');
		expectCompiledOutput(t, expected, actual, path.dirname(expectedFile));
	});
}

function run(main, cb) {
	var errors = [];
	browserify({ entries: [main], debug: true })
		.plugin('./index.js')
		.on('error', function (error) {
			errors.push(error);
		})
		.bundle()
		.pipe(es.wait(function (err, actual) {
			cb(errors, actual.toString());
		}));
}

function expectCompiledOutput(t, expected, actual, sourceDir) {
	// fix CRLFs on Windows; the expected output uses LFs
	actual = actual.replace(/\r\n/g, '\n');

	expectSource(t,
		convert.removeMapFileComments(expected),
		convert.removeComments(actual));
	expectSourcemap(t,
		convert.fromMapFileSource(expected, sourceDir).sourcemap,
		convert.fromSource(actual).sourcemap);
}

function expectSource(t, expected, actual) {
	if (expected === actual) {
		t.pass('Compiled output should match expected output');
	} else {
		console.log(ansidiff.lines(visibleNewlines(expected), visibleNewlines(actual)));
		t.fail('Compiled output should match expected output');
	}
}

function visibleNewlines(str) {
	return str.replace(/\r/g, '\\r\r')
		.replace(/\n/g, '\\n\n');
}

function expectSourcemap(t, expected, actual) {
	t.equal(actual.version, expected.version, 'Sourcemap version should match');
	t.equal(actual.file, expected.file, 'Sourcemap file should match');
	t.deepEqual(actual.sources.map(function (source) {
		// fix slash direction on Windows
		return source.replace(/\\/g, '/');
	}), expected.sources, 'Sourcemap sources should match');
	t.deepEqual(actual.names, expected.names, 'Sourcemap names should match');
	t.equal(actual.mappings, expected.mappings, 'Sourcemap mappings should match');
	t.deepEqual(actual.sourcesContent, expected.sourcesContent, 'Sourcemap sourcesContent should match');
}
