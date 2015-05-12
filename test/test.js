var test = require('tape');

var ansidiff = require('ansidiff');
var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs-extra');
var path = require('path');
var watchify = require('watchify');

var buildTimeout = 5000;

// Tests

test('no arguments', function (t) {
	run('./test/noArguments/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/noArguments/expected.js');
		t.end();
	});
});

test('full path includes', function (t) {
	run(path.resolve('./test/noArguments/x.ts'), function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/noArguments/expected.js');
		t.end();
	});
});

test('non-TS main file', function (t) {
	run('./test/withJsRoot/x.js', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/withJsRoot/expected.js');
		t.end();
	});
});

test('with adjacent compiled files', function (t) {
	run('./test/withAdjacentCompiledFiles/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/withAdjacentCompiledFiles/expected.js');
		t.end();
	});
});

test('with nested dependencies', function (t) {
	run('./test/withNestedDeps/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/withNestedDeps/expected.js');
		t.end();
	});
});

test('syntax error', function (t) {
	run('./test/syntaxError/x.ts', function (errors, actual) {
		expectErrors(t, errors, [
			{ name: 'TS1005', line: 1, column: 9, file: 'test/syntaxError/x.ts' },
			{ name: 'TS1005', line: 2, column: 9, file: 'test/syntaxError/x.ts' }
		]);
		expectNoOutput(t, actual);
		t.end();
	});
});

test('type error', function (t) {
	run('./test/typeError/x.ts', function (errors, actual) {
		expectErrors(t, errors, [
			{ name: 'TS2345', line: 4, column: 3, file: 'test/typeError/x.ts' }
		]);
		expectOutput(t, actual, './test/typeError/expected.js');
		t.end();
	});
});

test('type error with stopOnError', function (t) {
	run('./test/typeError/x.ts', { stopOnError: true }, function (errors, actual) {
		expectErrors(t, errors, [
			{ name: 'TS2345', line: 4, column: 3, file: 'test/typeError/x.ts' }
		]);
		expectNoOutput(t, actual);
		t.end();
	});
});

test('multiple entry points', function (t) {
	run(['./test/multipleEntryPoints/y.ts', './test/multipleEntryPoints/z.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/multipleEntryPoints/expected.js');
		t.end();
	});
});

test('including .d.ts file', function (t) {
	run(['./test/declarationFile/x.ts', './test/declarationFile/interface.d.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/declarationFile/expected.js');
		t.end();
	});
});

test('including external dependencies', function (t) {
	run('./test/externalDeps/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual, './test/externalDeps/expected.js');
		t.end();
	});
});

test('late added entries', function (t) {
	runLateAdded('./test/noArguments/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual.toString(), './test/noArguments/expected.js');
		t.end();
	});
});

test('late added entries with multiple entry points', function (t) {
	runLateAdded(['./test/multipleEntryPoints/y.ts', './test/multipleEntryPoints/z.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectOutput(t, actual.toString(), './test/multipleEntryPoints/expected.js');
		t.end();
	});
});

test('watchify', function (t) {
	fs.copySync('./test/watchify/ok.ts', './test/watchify/.tmp.ts');
	runWatchify('./test/watchify/main.ts', [
		function (errors, actual, triggerChange) {
			t.deepEqual(errors, [], 'Should have no compilation errors');
			fs.copySync('./test/watchify/typeError.ts', './test/watchify/.tmp.ts');
			triggerChange();
		},
		function (errors, actual, triggerChange) {
			t.ok(errors.length > 0, 'Should have type errors');
			fs.copySync('./test/watchify/syntaxError.ts', './test/watchify/.tmp.ts');
			triggerChange();
		},
		function (errors, actual, triggerChange) {
			t.ok(errors.length > 0, 'Should have syntax errors');
			fs.copySync('./test/watchify/ok.ts', './test/watchify/.tmp.ts');
			triggerChange();
		},
		function (errors, actual, triggerChange, b) {
			t.deepEqual(errors, [], 'Should have no compilation errors');
			b.close();
			t.end();
		}
	]);
});

// Test helpers

function run(main, tsifyOpts, cb) {
	runHelper(main, [], tsifyOpts, cb);
}

function runLateAdded(main, tsifyOpts, cb) {
	runHelper([], main, tsifyOpts, cb);
}

function runHelper(entries, add, tsifyOpts, cb) {
	var errors = [];
	var calledBack = false;

	if (!Array.isArray(entries))
		entries = [entries];
	if (!Array.isArray(add))
		add = [add];
	if (!cb) {
		cb = tsifyOpts;
		tsifyOpts = {};
	}

	var b = browserify({ entries: entries, debug: true })
		.plugin('./index.js', tsifyOpts);

	add.forEach(function (entry) {
		b.add(entry);
	});

	b.bundle()
		.on('error', function (error) {
			errors.push(error);
		})
		.pipe(es.wait(function (err, actual) {
			if (calledBack)
				throw new Error('Bundling completed after build timeout expired');
			calledBack = true;
			cb(errors, actual.toString());
		}));

	setTimeout(function () {
		if (calledBack)
			return;
		calledBack = true;
		cb(errors, null);
	}, buildTimeout);
}

function runWatchify(add, tsifyOpts, handlers) {
	if (!Array.isArray(add))
		add = [add];
	if (!handlers) {
		handlers = tsifyOpts;
		tsifyOpts = {};
	}

	var watcher = new EventEmitter();
	watcher.close = function () {};

	var b = watchify(browserify(watchify.args));
	b._watcher = function (file, opts) { return watcher; };
	b.plugin('./index.js', tsifyOpts);
	add.forEach(function (entry) {
		b.add(entry);
	});
	b.on('update', rebundle);
	rebundle();

	function rebundle() {
		var calledBack = false;
		var errors = [];

		b.bundle()
			.on('error', function (error) {
				errors.push(error);
			})
			.pipe(es.wait(function (err, actual) {
				if (calledBack)
					throw new Error('Bundling completed after build timeout expired');
				calledBack = true;
				callNextCallback(errors, actual.toString());
			}));

		setTimeout(function () {
			if (calledBack)
				return;
			calledBack = true;
			callNextCallback(errors, null);
		}, buildTimeout);
	}

	function callNextCallback(errors, actual) {
		// hack to wait for Watchify to finish adding any outstanding watchers
		setTimeout(function () {
			var cb = handlers.shift();
			cb(errors, actual, triggerChange, b);
		}, 100);
	}

	function triggerChange() {
		watcher.emit('change');
	}
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

function expectNoOutput(t, actual) {
	t.equal(actual, null, 'Should have no compiled output');
}

function expectOutput(t, actual, expectedFile) {
	t.notEqual(actual, null, 'Should have compiled output');
	if (actual === null) return;

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
