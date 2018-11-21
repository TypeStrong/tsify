'use strict';

var test = require('tape');

var browserify = require('browserify');
var convert = require('convert-source-map');
var es = require('event-stream');
var extend = require('util')._extend;
var EventEmitter = require('events').EventEmitter;
var fs = require('fs-extra');
var os = require('os');
var path = require('path');
var semver = require('semver');
var sm = require('source-map');
var stringToStream = require('string-to-stream');
var typescript = require('typescript');
var vm = require('vm');
var watchify = require('watchify');

var tsify = require('..');
var Host = require('../lib/Host')(typescript);

var buildTimeout = 8000;

// Tests

test('host', function (t) {

	var compilerHost = typescript.createCompilerHost({});
	var methods = Object.keys(compilerHost).filter(function (method) {
		return typeof compilerHost[method] === "function";
	});

	var ignore = ['getDefaultLibLocation'];
	methods.forEach(function (method) {
		if (ignore.indexOf(method) === -1) {
			t.assert(Host.prototype[method], 'implements ' + method);
		}
	});
	t.end();
});

test('no arguments', function (t) {
	run({
		bOpts: { entries: ['./test/noArguments/x.ts'] }
	}, function (errors, actual) {
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

test('basedir', function (t) {
	run({
		bOpts: { basedir: 'test', entries: ['./noArguments/x.ts'] }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/noArguments/x.ts', 'noArguments/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/noArguments/y.ts', 'noArguments/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'test/noArguments/z.ts', 'noArguments/z.ts', actual, '111');
		t.end();
	});
});

test('late added entries', function (t) {
	run({
		beforeBundle: function (b) { b.add('./test/noArguments/x.ts'); }
	}, function (errors, actual) {
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
	run({
		bOpts: { entries: [path.resolve('./test/noArguments/x.ts')] }
	}, function (errors, actual) {
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
	run({
		bOpts: { entries: ['./test/withJsRoot/x.js'] }
	}, function (errors, actual) {
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

test('non-TS main file and nested dependencies', function (t) {

	// The workaround mentioned in issue #148 - an empty TS file in the root -
	// is no longer required.

	process.chdir('./test/withJsRootAndNestedDeps');
	run({
		bOpts: { entries: ['./x.js'] }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'nested/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, 'nested/twice/z.ts', actual, '111');
		process.chdir('../..');
		t.end();
	});
});

test('with adjacent compiled files', function (t) {
	run({
		bOpts: { entries: ['./test/withAdjacentCompiledFiles/x.ts'] }
	}, function (errors, actual) {
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

test('with tsconfig.json', function (t) {
	process.chdir('./test/tsconfig');
	run({
		bOpts: { entries: ['./x.ts'] },
		tsifyOpts: { noEmitOnError: false }
	}, function (errors, actual) {
		expectErrors(t, errors, [{ name: 'TS7005', line: 1, column: 5, file: 'x.ts' }]);
		expectConsoleOutputFromScript(t, actual, [3]);
		process.chdir('../..');
		t.end();
	});
});

test('with tsconfig via project option', function (t) {
	process.chdir('./test/tsconfig');
	var project = {
		compilerOptions: {
			noImplicitAny: false
		}
	};
	run({
		bOpts: { entries: ['./x.ts'] },
		tsifyOpts: { project: project }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [3]);
		process.chdir('../..');
		t.end();
	});
});

test('exclude setting in tsconfig.json', function (t) {
	process.chdir('./test/tsconfigExclude');
	run({
		bOpts: { entries: ['./x.ts'] }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Doctor',
			'Seuss'
		]);
		expectMappedToken(t, 'x.ts', actual, 'x.thing1');
		process.chdir('../..');
		t.end();
	});
});

test('with multiple tsconfig.jsons (or is it tsconfigs.json?), finding default config', function (t) {
	process.chdir('./test/multipleConfigs');
	run({
		bOpts: { entries: ['./nested/x.ts'] },
		tsifyOpts: { noEmitOnError: false }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [3]);
		process.chdir('../..');
		t.end();
	});
});

test('with multiple tsconfig.jsons (or is it tsconfigs.json?) using project file', function (t) {
	process.chdir('./test/multipleConfigs');
	run({
		bOpts: { entries: ['./nested/x.ts'] },
		tsifyOpts: { noEmitOnError: false, project: 'tsconfig.custom.json' }
	}, function (errors, actual) {
		expectErrors(t, errors, [{ name: 'TS7005', line: 1, column: 5, file: 'nested/x.ts' }]);
		expectConsoleOutputFromScript(t, actual, [3]);
		process.chdir('../..');
		t.end();
	});
});

// This behavior relies on the fix in Microsoft/Typescript#2965 to work correctly
if (semver.gte(require('typescript').version, '1.9.0-dev')) {
	test('with multiple tsconfig.jsons (or is it tsconfigs.json?) using project dir', function (t) {
		process.chdir('./test/multipleConfigs');
		run({
			bOpts: { entries: ['./nested/x.ts'] },
			tsifyOpts: { noEmitOnError: false, project: 'nested' }
		}, function (errors, actual) {
			expectErrors(t, errors, [{ name: 'TS7005', line: 1, column: 5, file: 'nested/x.ts' }]);
			expectConsoleOutputFromScript(t, actual, [3]);
			process.chdir('../..');
			t.end();
		});
	});

	test('with multiple tsconfig.jsons (or is it tsconfigs.json?) using basedir', function (t) {
		process.chdir('./test/multipleConfigs');
		run({
			bOpts: { basedir: 'nested', entries: ['./x.ts'] },
			tsifyOpts: { noEmitOnError: false }
		}, function (errors, actual) {
			expectErrors(t, errors, [{ name: 'TS7005', line: 1, column: 5, file: 'nested/x.ts' }]);
			expectConsoleOutputFromScript(t, actual, [3]);
			process.chdir('../..');
			t.end();
		});
	});
}

test('allowJs', function (t) {
	run({
		bOpts: { entries: ['./test/allowJs/x.ts'] },
		tsifyOpts: { allowJs: true }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'test/allowJs/x.ts', actual, '\'hello world\'');
		expectMappedToken(t, 'test/allowJs/y.js', actual, 'console.log(message)');
		expectMappedToken(t, 'test/allowJs/z.js', actual, '111');
		t.end();
	});
});

test('with nested dependencies', function (t) {
	run({
		bOpts: { entries: ['./test/withNestedDeps/x.ts'] }
	}, function (errors, actual) {
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
	run({
		bOpts: { entries: ['./test/syntaxError/x.ts'] }
	}, function (errors, actual) {
		var fileName = Host._getCanonicalFileName('test/syntaxError/x.ts');
		expectErrors(t, errors, [
			{ name: 'TS1005', line: 1, column: 9, file: fileName },
			{ name: 'TS1005', line: 2, column: 9, file: fileName }
		]);
		t.end();
	});
});

test('type error', function (t) {
	run({
		bOpts: { entries: ['./test/typeError/x.ts'] }
	}, function (errors, actual) {
		var fileName = Host._getCanonicalFileName('test/typeError/x.ts');
		expectErrors(t, errors, [
			{ name: 'TS2345', line: 4, column: 3, file: fileName }
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
	run({
		bOpts: { entries: ['./test/typeError/x.ts'] },
		tsifyOpts: { noEmitOnError: true }
	}, function (errors, actual) {
		var fileName = Host._getCanonicalFileName('test/typeError/x.ts');
		expectErrors(t, errors, [
			{ name: 'TS2345', line: 4, column: 3, file: fileName }
		]);
		t.end();
	});
});

test('multiple entry points', function (t) {
	run({
		bOpts: { entries: ['./test/multipleEntryPoints/x1.ts', './test/multipleEntryPoints/x2.ts'] }
	}, function (errors, actual) {
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
	run({
		beforeBundle: function (b) {
			b.add('./test/multipleEntryPoints/x1.ts');
			b.add('./test/multipleEntryPoints/x2.ts');
		}
	}, function (errors, actual) {
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
	run({
		bOpts: { entries: ['./test/declarationFile/x.ts', './test/declarationFile/interface.d.ts'] }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Doctor',
			'Seuss'
		]);
		expectMappedToken(t, 'test/declarationFile/x.ts', actual, 'x.thing1');
		t.end();
	});
});

test('including .d.ts file via tsconfig', function (t) {
	run({
		bOpts: { entries: ['./test/declarationFile/x.ts'] },
		tsifyOpts: { project: './test/declarationFile/tsconfig.custom.json' }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Doctor',
			'Seuss'
		]);
		expectMappedToken(t, 'test/declarationFile/x.ts', actual, 'x.thing1');
		t.end();
	});
});

test('with shared tsconfig.json in higher directory', function (t) {
	process.chdir('./test/sharedTsconfig/project');
	run({
		bOpts: { entries: ['./x.ts'] }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Doctor',
			'Seuss'
		]);
		expectMappedToken(t, 'x.ts', actual, 'x.thing1');
		process.chdir('../../..');
		t.end();
	});
});

test('with files outside cwd', function (t) {
	process.chdir('./test/filesOutsideCwd/cwd');
	run({
		bOpts: { entries: ['./x.ts'] }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'hello world',
			'222'
		]);
		expectMappedToken(t, 'x.ts', actual, '\'hello world\'');
		expectMappedToken(t, '../shared/y.ts', actual, 'console.log(message)');
		expectMappedToken(t, '../shared/z.ts', actual, '111');
		process.chdir('../../..');
		t.end();
	});
});

test('including external dependencies', function (t) {
	run({
		bOpts: { entries: ['./test/externalDeps/x.ts'] }
	}, function (errors, actual) {
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

test('jsx: react', function (t) {
	run({
		bOpts: { entries: './test/tsx/main.ts' },
		tsifyOpts: { jsx: 'react' }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'div with contents: This is a cool component'
		]);
		expectMappedToken(t, 'test/tsx/CoolComponent.tsx', actual, 'div');
		t.end();
	});
});

test('jsx: preserve with babelify', function (t) {
	run({
		bOpts: { entries: ['./test/tsx/main.ts'] },
		tsifyOpts: { jsx: 'preserve' },
		beforeBundle: function (b) { b.transform('babelify', { presets: ['react'], extensions: ['.tsx'] }) }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'div with contents: This is a cool component'
		]);
		t.end();
	});
});

test('global transform', function (t) {
	run({
		bOpts: { entries: ['./test/globalTransform/a.ts'] },
		tsifyOpts: { global: true }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Hello from B!'
		]);
		t.end();
	});
});

test('watchify', function (t) {
	process.chdir('./test/watchify');
	fs.copySync('./ok.ts', './.tmp.ts');
	runWatchify({
		beforeBundle: function (b) { b.add('./main.ts') }
	}, [
		function (errors, actual, triggerChange) {
			t.deepEqual(errors, [], 'Should have no compilation errors');
			fs.copySync('./typeError.ts', './.tmp.ts');
			triggerChange();
		},
		function (errors, actual, triggerChange) {
			t.ok(errors.length > 0, 'Should have type errors');
			fs.copySync('./syntaxError.ts', './tmp.ts');
			triggerChange();
		},
		function (errors, actual, triggerChange) {
			t.ok(errors.length > 0, 'Should have syntax errors');
			fs.copySync('./ok.ts', './.tmp.ts');
			triggerChange();
		},
		function (errors, actual, triggerChange, b) {
			t.deepEqual(errors, [], 'Should have no compilation errors');
			b.close();
			process.chdir('../..');
			t.end();
		}
	]);
});

test('with custom compiler', function (t) {
	var ts = extend({}, require('typescript'));
	var oldCreateSourceFile = ts.createSourceFile;
	ts.createSourceFile = function (filename, text, languageVersion, version) {
		if (/x\.ts/.test(filename)) {
			text = 'console.log("Custom compiler was used");' + os.EOL + text;
		}
		return oldCreateSourceFile.call(ts, filename, text, languageVersion, version);
	}

	run({
		bOpts: { entries: ['./test/noArguments/x.ts'] },
		tsifyOpts: { typescript: ts }
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'Custom compiler was used',
			'hello world',
			'222'
		]);
		t.end();
	});
});

test('with empty output', function (t) {
	process.chdir('./test/emptyOutput');
	run({
		bOpts: { debug: false, entries: ['./x.ts'] },
		tsifyOpts: {}
	}, function (errors) {
		expectNoErrors(t, errors);
		process.chdir('../..');
		t.end();
	});
});

test('with overriden excludes', function (t) {
	process.chdir('./test/withFileOverrides');
	run({
		bOpts: { entries: ['./index.ts'] },
		tsifyOpts: { exclude: [] }
	}, function (errors, actual, files) {
		expectNoErrors(t, errors);
		expectFiles(t, files, {
			'foo.ts': true,
			'bar.ts': true,
			'bar-exam.ts': true,
			'bar-tender.ts': true,
			'index.ts': true
		});
		process.chdir('../..');
		t.end();
	});
});

test('with overriden files', function (t) {
	process.chdir('./test/withFileOverrides');
	run({
		bOpts: { entries: ['./index.ts'] },
		tsifyOpts: { files: [] }
	}, function (errors, actual, files) {
		expectNoErrors(t, errors);
		expectFiles(t, files, {
			'foo.ts': false,
			'bar.ts': false,
			'bar-exam.ts': false,
			'bar-tender.ts': true,
			'index.ts': true
		});
		process.chdir('../..');
		t.end();
	});
});

test('with overriden includes', function (t) {
	process.chdir('./test/withFileOverrides');
	run({
		bOpts: { entries: ['./index.ts'] },
		tsifyOpts: { include: [] }
	}, function (errors, actual, files) {
		expectNoErrors(t, errors);
		expectFiles(t, files, {
			'foo.ts': true,
			'bar.ts': true,
			'bar-exam.ts': false,
			'bar-tender.ts': false,
			'index.ts': true
		});
		process.chdir('../..');
		t.end();
	});
});

test('with required stream', function (t) {
	process.chdir('./test/withRequiredStream');
	run({
		bOpts: { debug: false, entries: ['./x.ts'] },
		tsifyOpts: { allowJs: true },
		beforeBundle: function (b) {
			b.exclude('streamed');
			b.require(stringToStream('exports.name = "streamed";'), { expose: 'streamed', basedir: './' });
		}
	}, function (errors, actual) {
		expectNoErrors(t, errors);
		expectConsoleOutputFromScript(t, actual, [
			'streamed'
		]);
		process.chdir('../..');
		t.end();
	});
});

// Test helpers

function run(config, cb) {
	var bOpts = config.bOpts || {};
	if (bOpts.debug === undefined) {
		bOpts.debug = true;
	}

	var tsifyOpts = config.tsifyOpts || {};
	var beforeBundle = config.beforeBundle || function() {};

	var files = []
	var b = browserify(bOpts)
		.on('file', function (file) {
			files.push(file);
		})
		.plugin(tsify, tsifyOpts);
	beforeBundle(b);

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
			cb(errors, actual.toString(), files);
		}));

	setTimeout(function () {
		if (calledBack)
			return;
		calledBack = true;
		cb(errors, null, null);
	}, buildTimeout);
}

function runWatchify(config, handlers) {
	var bOpts = config.bOpts || {};
	bOpts.debug = true;

	var tsifyOpts = config.tsifyOpts || {};
	var beforeBundle = config.beforeBundle || function() {};

	var watcher = new EventEmitter();
	watcher.close = function () {};

	var b = watchify(browserify(watchify.args));
	b._watcher = function () { return watcher; };
	b.plugin(tsify, tsifyOpts);
	beforeBundle(b);

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
	for (var i = 0; i < actual.length && i < expected.length; ++i) {
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

function expectConsoleOutputFromScript(t, src, expected) {
	t.notEqual(src, null, 'Should have compiled output');

	var actual = [];
	var sandbox = { console: { log: function (str) { actual.push(str); }}};
	try {
		vm.runInNewContext(src, sandbox);
		t.deepEqual(actual, expected, 'Should have expected console.log output');
	} catch (err) {
		t.fail(err);
	}
}

function expectMappedToken(t, srcFile, mapSourceFile, compiled, token) {
	if (!token) {
		token = compiled;
		compiled = mapSourceFile;
		mapSourceFile = srcFile;
	}

	var src = fs.readFileSync(srcFile, 'utf-8');
	var compiledPosition = indexToLineAndColumn(compiled, compiled.indexOf(token));
	var expectedSrcPosition = indexToLineAndColumn(src, src.indexOf(token));
	expectedSrcPosition.name = null;
	expectedSrcPosition.source = mapSourceFile;

	if (expectedSrcPosition.column === -1) {
		t.fail('Token "' + token + '" should be in expected code');
	}
	if (compiledPosition.column === -1) {
		t.fail('Token "' + token + '" should be in compiled code');
	}

	if (expectedSrcPosition.column !== -1 && compiledPosition.column !== -1) {
		var map = convert.fromSource(compiled).toObject();
		var smc = new sm.SourceMapConsumer(map);
		var actualSrcPosition = smc.originalPositionFor(compiledPosition);

		t.deepEqual(actualSrcPosition, expectedSrcPosition, 'Token "' + token + '" should be mapped correctly');
	}
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

function expectFiles(t, emitted, expected) {

	Object.keys(expected).forEach(function (key) {
		var index = findIndex(key);
		if (expected[key]) {
			t.notEqual(index, -1, 'Should emit ' + key);
		} else {
			t.equal(index, -1, 'Should not emit ' + key);
		}
	});

	function findIndex(file) {
		for (var i = 0; i < emitted.length; ++i) {
			if (new RegExp(file + '$').test(emitted[i])) {
				return i;
			}
		}
		return -1;
	}
}
