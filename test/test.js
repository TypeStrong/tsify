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

test('full path includes', function (t) {
	t.plan(8);
	expectSuccess(t,
		path.resolve('./test/noArguments/x.ts'),
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
	t.plan(13);
	run('./test/syntaxError/x.ts', function (errors) {
		t.equal(errors.length, 2, 'Should have 2 errors in total');
		t.equal(errors[0].name, 'TS1005', 'Should have syntax error on first import');
		t.equal(errors[0].line, 1, 'First error should be on line 1');
		t.equal(errors[0].column, 9, 'First error should be on column 9');
		t.ok(errors[0].message.match(/test\/syntaxError\/x\.ts/), 'First error message should contain file info');
		t.ok(errors[0].message.match(/\(1,9\)/), 'First error message should contain position info');
		t.ok(errors[0].message.match(/TS1005/), 'First error message should contain error info');
		t.equal(errors[1].name, 'TS1005', 'Should have syntax error on second import');
		t.equal(errors[1].line, 2, 'Second error should be on line 2');
		t.equal(errors[1].column, 9, 'Second error should be on column 9');
		t.ok(errors[1].message.match(/test\/syntaxError\/x\.ts/), 'First error message should contain file info');
		t.ok(errors[1].message.match(/\(2,9\)/), 'Second error message should contain position info');
		t.ok(errors[1].message.match(/TS1005/), 'Second error message should contain error info');
	});
});

test('type error', function (t) {
	t.plan(7);
	run('./test/typeError/x.ts', function (errors) {
		t.equal(errors.length, 1, 'Should have 1 error in total');
		t.equal(errors[0].name, 'TS2345', 'Should have "Argument is not assignable to parameter" error');
		t.equal(errors[0].line, 4, 'Error should be on line 4');
		t.equal(errors[0].column, 3, 'Error should be on column 3');
		t.ok(errors[0].message.match(/test\/typeError\/x\.ts/), 'Error message should contain file info');
		t.ok(errors[0].message.match(/\(4,3\)/), 'Error message should contain position info');
		t.ok(errors[0].message.match(/TS2345/), 'Error message should contain error info');
	});
});

test('multiple entry points', function (t) {
	t.plan(8);
	expectSuccess(t,
		['./test/multipleEntryPoints/y.ts', './test/multipleEntryPoints/z.ts'],
		'./test/multipleEntryPoints/expected.js');
});

test('including .d.ts file', function (t) {
	t.plan(8);
	expectSuccess(t,
		['./test/declarationFile/x.ts', './test/declarationFile/interface.d.ts'],
		'./test/declarationFile/expected.js');
});

test('including external dependencies', function (t) {
	t.plan(8);
	expectSuccess(t,
		'./test/externalDeps/x.ts',
		'./test/externalDeps/expected.js');
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
			t.deepEqual(errors, [], 'Should have no compilation errors');
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
			t.deepEqual(errors, [], 'Should have no compilation errors');
			expectCompiledOutput(t, expected, actual.toString(), path.dirname(expectedFile));
		}));
});

function expectSuccess(t, main, expectedFile) {
	var expected = fs.readFileSync(expectedFile).toString();
	run(main, function (errors, actual) {
		t.deepEqual(errors, [], 'Should have no compilation errors');
		expectCompiledOutput(t, expected, actual, path.dirname(expectedFile));
	});
}

function run(main, cb) {
	var errors = [];
	if (!Array.isArray(main))
		main = [main];

	browserify({ entries: main, debug: true })
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
