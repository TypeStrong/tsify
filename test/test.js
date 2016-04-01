var test = require('tape');

var _ = require('lodash');
var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var sm = require('source-map');
var watchify = require('watchify');
var vm = require('vm');

var tsify = require('..');

var buildTimeout = 5000;

// Tests

test('no arguments', function (t) {
	run('./test/noArguments/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/noArguments/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/noArguments/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/noArguments/z.ts', actual, '111');
		t.end();
	});
});

test('late added entries', function (t) {
	runLateAdded('./test/noArguments/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/noArguments/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/noArguments/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/noArguments/z.ts', actual, '111');
		t.end();
	});
});

test('full path includes', function (t) {
	run(path.resolve('./test/noArguments/x.ts'), function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/noArguments/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/noArguments/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/noArguments/z.ts', actual, '111');
		t.end();
	});
});

test('non-TS main file', function (t) {
	run('./test/withJsRoot/x.js', function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/withJsRoot/x.js', actual, 'y(\'hello world\')');
		expectMappedToken(t, 'test/withJsRoot/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/withJsRoot/z.ts', actual, '111');
		t.end();
	});
});

test('with adjacent compiled files', function (t) {
	run('./test/withAdjacentCompiledFiles/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/withAdjacentCompiledFiles/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/withAdjacentCompiledFiles/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/withAdjacentCompiledFiles/z.ts', actual, '111');
		t.end();
	});
});
test('allowJs', function (t) {
	run('./test/allowJs/x.ts', { allowJs: true }, function (errors, actual) {
    console.log('actual: ' + actual);
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/allowJs/x.ts', actual, '\'hello world\'');
		expectMappedLine(t, 'test/allowJs/y.js', actual, 'console.log(message)');
		expectMappedLine(t, 'test/allowJs/z.js', actual, '111');
		t.end();
	});
});

test('allowJs2', function (t) {
	run('./test/allowJs2/y.js', { allowJs: true, allowNonTsExtensions: true, target: 'ES5' }, function (errors, actual) {
    console.log('actual: ' + actual);
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'message = hello'
		]);
		expectMappedLine(t, 'test/allowJs2/y.js', actual, 'console.log(message)');
		t.end();
	});
});

test('with nested dependencies', function (t) {
	run('./test/withNestedDeps/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/withNestedDeps/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/withNestedDeps/nested/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/withNestedDeps/nested/twice/z.ts', actual, '111');
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
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			222
		]);
		expectMappedToken(t, 'test/typeError/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/typeError/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/typeError/z.ts', actual, '111');
		t.end();
	});
});

test('type error with noEmitOnError', function (t) {
	run('./test/typeError/x.ts', { noEmitOnError: true }, function (errors, actual) {
		expectErrors(t, errors, [
			{ name: 'TS2345', line: 4, column: 3, file: 'test/typeError/x.ts' }
		]);
		expectNoOutput(t, actual);
		t.end();
	});
});

test('multiple entry points', function (t) {
	run(['./test/multipleEntryPoints/x1.ts', './test/multipleEntryPoints/x2.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222',
			'goodbye world',
			'555'
		]);
		expectMappedToken(t, 'test/multipleEntryPoints/x1.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/multipleEntryPoints/x2.ts', actual, '\'goodbye world\'');
		expectMappedToken(t, 'test/multipleEntryPoints/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/multipleEntryPoints/z.ts', actual, '111');
		t.end();
	});
});

test('late added entries with multiple entry points', function (t) {
	runLateAdded(['./test/multipleEntryPoints/x1.ts', './test/multipleEntryPoints/x2.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222',
			'goodbye world',
			'555'
		]);
		expectMappedToken(t, 'test/multipleEntryPoints/x1.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/multipleEntryPoints/x2.ts', actual, '\'goodbye world\'');
		expectMappedToken(t, 'test/multipleEntryPoints/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/multipleEntryPoints/z.ts', actual, '111');
		t.end();
	});
});

test('including .d.ts file', function (t) {
	run(['./test/declarationFile/x.ts', './test/declarationFile/interface.d.ts'], function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Doctor',
			'Seuss'
		]);
		expectMappedToken(t, 'test/declarationFile/x.ts', actual, 'x.thing1');
		t.end();
	});
});

test('including external dependencies', function (t) {
	run('./test/externalDeps/x.ts', function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'node-foo aaa:this',
			'node-foo bbb:is a',
			'node-foo ccc:test'
		]);
		expectMappedToken(t, 'test/externalDeps/x.ts', actual, '\'is a\'');
		t.end();
	});
});

test('tsx', function (t) {
	run('./test/tsx/main.ts', { jsx: 'react' }, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'div with contents: This is a cool component'
		]);
		expectMappedToken(t, 'test/tsx/CoolComponent.tsx', actual, 'div');
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

test('with tsconfig.json', function (t) {
	process.chdir('./test/tsconfig');
	run('./x.ts', { noEmitOnError: false }, function (errors, actual) {
		expectErrors(t, errors, [{ name: 'TS7005', line: 1, column: 5, file: 'x.ts' }]);
		expectConsoleOutputFromScript(t, actual, [3]);
		process.chdir('../..');
		t.end();
	});
});

test('with custom compiler', function (t) {
	var ts = _.clone(require('typescript'));

	var oldCreateSourceFile = ts.createSourceFile;
	ts.createSourceFile = function (filename, text, languageVersion, version) {
		if (/x\.ts/.test(filename)) {
			text = 'console.log("Custom compiler was used");' + os.EOL + text;
		}
		return oldCreateSourceFile.call(ts, filename, text, languageVersion, version);
	}

	run('./test/noArguments/x.ts', { typescript: ts }, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Custom compiler was used',
			'hello world',
			'222'
		]);
		t.end();
	});
})

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
		.plugin(tsify, tsifyOpts);

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
	b._watcher = function () { return watcher; };
	b.plugin(tsify, tsifyOpts);
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
		t.equal(actual[i].fileName, expected[i].file, 'Error #' + i + ' should have filename ' + expected[i].name);
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

function expectConsoleOutputFromScript(t, src, expected) {
	t.notEqual(src, null, 'Should have compiled output');

	var actual = [];
	var sandbox = { console: { log: function (str) { actual.push(str); }}};
	vm.runInNewContext(src, sandbox);
	t.deepEqual(actual, expected, 'Should have expected console.log output');
}

function expectMappedToken(t, srcFile, compiled, token) {
	var src = fs.readFileSync(srcFile, 'utf-8');
	var compiledPosition = indexToLineAndColumn(compiled, compiled.indexOf(token));
	var expectedSrcPosition = indexToLineAndColumn(src, src.indexOf(token));
	expectedSrcPosition.name = null;
	expectedSrcPosition.source = srcFile;

	var map = convert.fromSource(compiled).toObject();
	var smc = new sm.SourceMapConsumer(map);
	var actualSrcPosition = smc.originalPositionFor(compiledPosition);

	t.deepEqual(actualSrcPosition, expectedSrcPosition, 'Token "' + token + '" should be mapped correctly');
}

function expectMappedLine(t, srcFile, compiled, token) {
	var src = fs.readFileSync(srcFile, 'utf-8');
	var compiledPosition = indexToLineAndColumn(compiled, compiled.indexOf(token));
	var expectedSrcPosition = indexToLineAndColumn(src, src.indexOf(token));
	expectedSrcPosition.name = null;
	expectedSrcPosition.source = srcFile;
	expectedSrcPosition.column = 0;

	var map = convert.fromSource(compiled).toObject();
	var smc = new sm.SourceMapConsumer(map);
	var actualSrcPosition = smc.originalPositionFor(compiledPosition);

	t.deepEqual(actualSrcPosition, expectedSrcPosition, 'Line containing token "' + token + '" should be mapped correctly');
}

function countLinesUntil(str, index) {
	var count = 1;
	while ((index = str.lastIndexOf('\n', index)) !== -1) {
		++count;
		--index;
	}
	return count;
}

function indexToLineAndColumn(src, index) {
	var indexOfLine = src.lastIndexOf('\n', index-1) + 1;
	return { line: countLinesUntil(src, indexOfLine), column: index - indexOfLine };
}
