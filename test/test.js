var test = require('tape');

var ansidiff = require('ansidiff');
var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var fs = require('fs-extra');
var path = require('path');
var watchify = require('watchify');

test('no arguments', function (t) {
	t.plan(8);
	run('./test/noArguments/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/noArguments/expected.js');
	});
});

test('full path includes', function (t) {
	t.plan(8);
	run(path.resolve('./test/noArguments/x.ts'), function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/noArguments/expected.js');
	});
});

test('non-TS main file', function (t) {
	t.plan(8);
	run('./test/withJsRoot/x.js', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/withJsRoot/expected.js');
	});
});

test('with adjacent compiled files', function (t) {
	t.plan(8);
	run('./test/withAdjacentCompiledFiles/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/withAdjacentCompiledFiles/expected.js');
	});
});

test('with nested dependencies', function (t) {
	t.plan(8);
	run('./test/withNestedDeps/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/withNestedDeps/expected.js');
	});
});

test('syntax error', function (t) {
	t.plan(13);
	run('./test/syntaxError/x.ts', function (errors, actual) {
		expectErrors(t, errors, [
			{ name: 'TS1005', line: 1, column: 9, file: 'test/syntaxError/x.ts' },
			{ name: 'TS1005', line: 2, column: 9, file: 'test/syntaxError/x.ts' }
		]);
	});
});

test('type error', function (t) {
	t.plan(7);
	run('./test/typeError/x.ts', function (errors) {
		expectErrors(t, errors, [
			{ name: 'TS2345', line: 4, column: 3, file: 'test/typeError/x.ts' }
		]);
	});
});

test('multiple entry points', function (t) {
	t.plan(8);
	run(['./test/multipleEntryPoints/y.ts', './test/multipleEntryPoints/z.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/multipleEntryPoints/expected.js');
	});
});

test('including .d.ts file', function (t) {
	t.plan(8);
	run(['./test/declarationFile/x.ts', './test/declarationFile/interface.d.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/declarationFile/expected.js');
	});
});

test('including external dependencies', function (t) {
	t.plan(8);
	run('./test/externalDeps/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/externalDeps/expected.js');
	});
});

test('late added entries', function (t) {
	t.plan(8);
	runLateAdded('./test/noArguments/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual.toString(), './test/noArguments/expected.js');
	});
});

test('late added entries with multiple entry points', function (t) {
	t.plan(8);
	runLateAdded(['./test/multipleEntryPoints/y.ts', './test/multipleEntryPoints/z.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual.toString(), './test/multipleEntryPoints/expected.js');
	});
});

test('watchify', function (t) {
	var errors = [];
	var b = watchify(browserify(watchify.args))
		.plugin('./index.js')
		.add('./test/watchify/main.ts')
		.on('update', rebundle);

	fs.copySync('./test/watchify/ok.ts', './test/watchify/.tmp.ts');
	var handlers = [
		function () {
			t.deepEqual(errors, [], 'Should have no compilation errors');
			fs.copySync('./test/watchify/typeError.ts', './test/watchify/.tmp.ts');
		},
		function (err, actual) {
			t.ok(errors.length > 0, 'Should have type errors');
			errors = [];
			fs.copySync('./test/watchify/syntaxError.ts', './test/watchify/.tmp.ts');
		},
		function (err, actual) {
			t.ok(errors.length > 0, 'Should have syntax errors');
			errors = [];
			fs.copySync('./test/watchify/ok.ts', './test/watchify/.tmp.ts');
		},
		function (err, actual) {
			t.deepEqual(errors, [], 'Should have no compilation errors');
			b.close();
			t.end();
		}
	];

	rebundle();

	function rebundle() {
		return b.bundle()
			.on('error', function (error) {
				errors.push(error);
			})
			.pipe(es.wait(function (err, actual) {
				// hack to wait for Watchify to finish adding any outstanding watchers
				setTimeout(handlers.shift(), 100);
			}));
	}
});


function run(main, cb) {
	var errors = [];
	if (!Array.isArray(main))
		main = [main];

	browserify({ entries: main, debug: true })
		.plugin('./index.js')
		.bundle()
		.on('error', function (error) {
			errors.push(error);
		})
		.pipe(es.wait(function (err, actual) {
			cb(errors, actual.toString());
		}));
}

function runLateAdded(main, cb) {
	var errors = [];
	if (!Array.isArray(main))
		main = [main];

	var b = browserify({ debug: true })
		.plugin('./index.js');

	main.forEach(function (entry) {
		b.add(entry);
	});

	b.bundle()
		.on('error', function (error) {
			errors.push(error);
		})
		.pipe(es.wait(function (err, actual) {
			cb(errors, actual.toString());
		}));
}

function expectNoErrors(t, errors) {
	t.deepEqual(errors, [], 'Should have no compilation errors');
}

function expectErrors(t, actual, expected) {
	t.equal(actual.length, expected.length, 'Should have the correct error count');
	for (var i = 0; i < actual.length; ++i) {
		t.equal(actual[i].name, expected[i].name, 'Error #' + i + ' should be of type ' + expected[i].name);
		t.equal(actual[i].line, expected[i].line, 'Error #' + i + ' should be on line ' + expected[i].line);
		t.equal(actual[i].column, expected[i].column, 'Error #' + i + ' should be on column ' + expected[i].column);
		t.ok(actual[i].message.indexOf(expected[i].file) > -1,
			'Error #' + i + ' message should contain file info');
		t.ok(actual[i].message.indexOf('(' + expected[i].line + ',' + expected[i].column + ')') > -1,
			'Error #' + i + ' message should contain position info');
		t.ok(actual[i].message.indexOf(expected[i].name) > -1,
			'Error #' + i + ' message should contain error info');
	}
}

function expectOutput(t, actual, expectedFile) {
	var expected = fs.readFileSync(expectedFile).toString();
	var sourceDir = path.dirname(expectedFile);

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
		// The following code fixes an odd bug with browserify (out of our control) in which it produces sourcemap paths
		// that are strangely relative yet technically correct when it's running from within a directory
		// junction on windows. It does this by resolving out symlinks fully to compare actual relative paths.
		var cwd = fs.realpathSync(process.cwd());
		source = fs.realpathSync(source);
		source = path.relative(cwd, source);

		// fix slash direction on Windows
		return source.replace(/\\/g, '/');
	}), expected.sources, 'Sourcemap sources should match');
	t.deepEqual(actual.names, expected.names, 'Sourcemap names should match');
	t.equal(actual.mappings, expected.mappings, 'Sourcemap mappings should match');
	t.deepEqual(actual.sourcesContent, expected.sourcesContent, 'Sourcemap sourcesContent should match');
}
