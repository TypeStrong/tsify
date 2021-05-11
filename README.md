# tsify

[Browserify](http://browserify.org/) plugin for compiling [TypeScript](http://www.typescriptlang.org/)

[![NPM version](https://img.shields.io/npm/v/tsify.svg)](https://www.npmjs.com/package/tsify)
[![Downloads](http://img.shields.io/npm/dm/tsify.svg)](https://npmjs.org/package/tsify)
[![Build status](https://img.shields.io/travis/TypeStrong/tsify.svg)](http://travis-ci.org/TypeStrong/tsify)
[![Dependency status](https://img.shields.io/david/TypeStrong/tsify.svg)](https://david-dm.org/TypeStrong/tsify)
[![devDependency Status](https://img.shields.io/david/dev/TypeStrong/tsify.svg)](https://david-dm.org/TypeStrong/tsify#info=devDependencies)
[![peerDependency Status](https://img.shields.io/david/peer/TypeStrong/tsify.svg)](https://david-dm.org/TypeStrong/tsify#info=peerDependencies)

# Example Usage

### Browserify API:

``` js
var browserify = require('browserify');
var tsify = require('tsify');

browserify()
    .add('main.ts')
    .plugin(tsify, { noImplicitAny: true })
    .bundle()
    .on('error', function (error) { console.error(error.toString()); })
    .pipe(process.stdout);
```

### Command line:

``` sh
$ browserify main.ts -p [ tsify --noImplicitAny ] > bundle.js
```

Note that when using the Browserify CLI, compilation will always halt on the first error encountered, unlike the regular TypeScript CLI.  This behavior can be overridden in the API, as shown in the API example.

Also note that the square brackets `[ ]` in the example above are *required* if you want to pass parameters to tsify; they don't denote an optional part of the command.

# Installation

Just plain ol' [npm](https://npmjs.org/) installation:

### 1. Install browserify
```sh
npm install browserify
```

### 2. Install typescript

``` sh
npm install typescript
```

### 3. Install tsify
``` sh
npm install tsify
```

For use on the command line, use the flag `npm install -g`.

# Options

* **tsify** will generate inline sourcemaps if the `--debug` option is set on Browserify, regardless of the flag status in `tsconfig.json`.
* **tsify** supports almost all options from the TypeScript compiler.  Notable exceptions:
	* `-d, --declaration` - See [tsify#15](https://github.com/TypeStrong/tsify/issues/15)
	* `--out, --outDir` - Use Browserify's file output options instead.  These options are overridden because **tsify** writes to an internal memory store before bundling, instead of to the filesystem.
* **tsify** supports the TypeScript compiler's `-p, --project` option which allows you to specify the path that will be used when searching for the `tsconfig.json` file. You can pass either the path to a directory or to the `tsconfig.json` file itself. (When using the API, the `project` option can specify either a path to a directory or file, or the JSON content of a `tsconfig.json` file.)
* **tsify** supports overriding the `files`, `exclude` and `include` options. In particular, if `"files": []` is specified, only the Browserify entry points (and their dependencies) are passed to TypeScript for compilation.
* **tsify** supports the following extra options:
	* `--global` - This will set up **tsify** as a global transform.  See the [Browserify docs](https://github.com/substack/node-browserify#btransformtr-opts) for the implications of this flag.
	* `--typescript` - By default we just do `require('typescript')` to pickup whichever version you installed. However, this option allows you to pass in a different TypeScript compiler, such as [NTypeScript](https://github.com/TypeStrong/ntypescript). Note that when using the API, you can pass either the name of the alternative compiler or a reference to it:
		* `{ typescript: 'ntypescript' }`
		* `{ typescript: require('ntypescript') }`

# Does this work with...

### tsconfig.json?

tsify will automatically read options from `tsconfig.json`.  However, some options from this file will be ignored:

* `compilerOptions.declaration` - See [tsify#15](https://github.com/TypeStrong/tsify/issues/15)
* `compilerOptions.out`, `compilerOptions.outDir`, and `compilerOptions.noEmit` - Use Browserify's file output options instead.  These options are overridden because **tsify** writes its intermediate JavaScript output to an internal memory store instead of to the filesystem.
* `files` - Use Browserify's file input options instead.  This is necessary because Browserify needs to know which file(s) are the entry points to your program.
* `compilerOptions.sourceMaps` - Source maps are only generated if the `--debug` option is set on Browserify.
* `compilerOptions.inlineSourceMaps` - Generated source maps are always inline.

### Watchify?

Yes!  **tsify** can do incremental compilation using [watchify](//github.com/substack/watchify), resulting in much faster incremental build times.  Just follow the Watchify documentation, and add **tsify** as a plugin as indicated in the documentation above.

### Gulp?

No problem.  See the Gulp recipes on using [browserify](https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-uglify-sourcemap.md) and [watchify](https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md), and add **tsify** as a plugin as indicated in the documentation above.

### Grunt?

Use [grunt-browserify](https://github.com/jmreidy/grunt-browserify) and you should be good!  Just add **tsify** as a plugin in your Grunt configuration.

### IE 11?

The inlined sourcemaps that Browserify generates [may not be readable by IE 11](//github.com/TypeStrong/tsify/issues/19) for debugging purposes.  This is easy to fix by adding [exorcist](//github.com/thlorenz/exorcist) to your build workflow after Browserify.

### ES2015? *(formerly known as ES6)*

TypeScript's ES2015 output mode should work without too much additional setup.  Browserify does not support ES2015 modules, so if you want to use ES2015 you still need some transpilation step.  Make sure to add [babelify](//github.com/babel/babelify) to your list of transforms.  Note that if you are using the API, you need to set up **tsify** before babelify:

``` js
browserify()
    .plugin(tsify, { target: 'es6' })
    .transform(babelify, { extensions: [ '.tsx', '.ts' ] })
```

# FAQ / Common issues

### SyntaxError: 'import' and 'export' may appear only with 'sourceType: module'

This error occurs when a TypeScript file is not compiled to JavaScript before being run through the Browserify bundler.  There are a couple known reasons you might run into this.

* If you are trying to output in ES6 mode, then you have to use an additional transpilation step such as [babelify](//github.com/babel/babelify) because Browserify does not support bundling ES6 modules.
* Make sure that if you're using the API, your setup `.plugin('tsify')` is done *before* any transforms such as `.transform('babelify')`.  **tsify** needs to run first!
* There is a known issue in Browserify regarding including files with `expose` set to the name of the included file.  More details and a workaround are available in [#60](//github.com/TypeStrong/tsify/issues/60).

# Why a plugin?

There are several TypeScript compilation transforms available on npm, all with various issues.  The TypeScript compiler automatically performs dependency resolution on module imports, much like Browserify itself.  Browserify transforms are not flexible enough to deal with multiple file outputs given a single file input, which means that any working TypeScript compilation transform either skips the resolution step (which is necessary for complete type checking) or performs multiple compilations of source files further down the dependency graph.

**tsify** avoids this problem by using the power of plugins to perform a single compilation of the TypeScript source up-front, using Browserify to glue together the resulting files.

# License

MIT

# Changelog

* 5.0.4 - Fix export in `d.ts` file.
* 5.0.3 - Improve detection of case-sensitive file systems.
* 5.0.2 - Remove `@types/browserify` and incorrect/undocumented use of TypeScript types in `tsify` signature.
* 5.0.1 - Remove default import from `index.d.ts` and add `@types/browserify` dependency.
* 5.0.0 - **Breaking**: Fix type declarations for TypeScript 4 compatibility. With this fix, the TypeScript version must be 2.8 or above.
* 4.0.2 - Add `types` to `package.json`.
* 4.0.1 - Fix so that `watchify` does not stop listening.
* 4.0.0 - Re-applied changes from 3.0.2: added support for the `forceConsistentCasingInFilenames` compiler option.
* 3.0.4 - Added support for overriding the `files`, `exclude` and `include` options.
* 3.0.3 - Reverted 3.0.2.
* 3.0.2 - Added support for the `forceConsistentCasingInFilenames` compiler option.
* 3.0.1 - Fixed an error with file system case sensitivity detection.
* 3.0.0 - **Breaking**: Dropped support for Browserify < 10.x. Re-instated changes from 2.0.4 to 2.0.7.
* 2.0.8 - Reverted to 2.0.3. Changes introduced from 2.0.4 to 2.0.7 have issues with early versions of Browserify.
* 2.0.7 - Tracked files for filtered stream and module-name 'rows'. Using `allowJs` no longer causes problems with streams.
* 2.0.6 - Filtered module-name 'rows', too, as filtering only source 'rows' re-broke Browserify's [require](https://github.com/substack/node-browserify#brequirefile-opts) option.
* 2.0.5 - The fix in 2.0.4 was too aggressive, as it filtered too many Browserify 'rows'. Now, only 'rows' from stream sources are filtered.
* 2.0.4 - Fixed a bug that broke Browserify's [require](https://github.com/substack/node-browserify#brequirefile-opts) option.
* 2.0.3 - Fixed a bug related to case-sensitive paths and normalized more path parameters.
* 2.0.2 - Added support for specifying the `project` option using the JSON content of a `tsconfig.json` file.
* 2.0.1 - Fixed a bug in which the `include` option was broken if `tsconfig.json` was not in the current directory.
* 2.0.0 - **Breaking**: updated to the latest `tsconfig`, so `filesGlob` is no longer supported. Use TypeScript 2's `exclude` and `include` options instead.
* 1.0.9 - Implemented additional compiler host methods to support the default inclusion of visible `@types` modules.
* 1.0.8 - Implemented file system case-sensitivity detection, fixing [#200](//github.com/TypeStrong/tsify/issues/200).
* 1.0.7 - Replaced `Object.assign` with [`object-assign`](https://github.com/sindresorhus/object-assign) for Node 0.12 compatibility.
* 1.0.6 - Fixed a bug in which TypeScript 2 libraries (specified using the `lib` option) were left out of the compilation when bundling on Windows.
* 1.0.5 - Fixed a bug where empty output resulted in an error.
* 1.0.4 - Fixed numerous bugs:
    * Refactored to use canonical file names, fixing [#122](//github.com/TypeStrong/tsify/issues/122), [#135](//github.com/TypeStrong/tsify/issues/135), [#148](//github.com/TypeStrong/tsify/issues/148), [#150](//github.com/TypeStrong/tsify/issues/150) and [#161](//github.com/TypeStrong/tsify/issues/161).
    * Refactored to avoid having to infer the TypeScript root, fixing [#152](//github.com/TypeStrong/tsify/issues/152).
    * Misconfiguration of `tsify` as a transform now results in an explicit error.
    * Internal errors that previously went unreported are now emitted to Browserify.
* 1.0.3 - Fixed a bug introduced in 1.0.2 (that resulted in the `target` being set to `ES3`).
* 1.0.2 - Added support for the TypeScript compiler's short-name, command-line options (e.g. `-p`).
* 1.0.1 - On Windows, sometimes, the Browserify `basedir` contains backslashes that need normalization for findConfigFile to work correctly.
* 1.0.0 - **Breaking**: TypeScript is now a `devDependency` so we don't install one for you. Please run `npm install typescript --save-dev` in your project to use whatever version you want.
* 0.16.0 - Reinstated changes from 0.15.5.
* 0.15.6 - Reverted 0.15.5 because of breaking changes.
* 0.15.5 - Used `TypeStrong/tsconfig` for parsing `tsconfig.json` to add support for `exclude` and more.
* 0.15.4 - Fixed some compilation failures introduced by v0.14.3.
* 0.15.3 - Added support for the `--global` flag to use **tsify** as a global transform.
* 0.15.2 - Added support for the `files` property of `tsconfig.json`.
* 0.15.1 - Added support for `--project` flag to use a custom location for `tsconfig.json`.
* 0.15.0 - Removed `debuglog` dependency.
* 0.14.8 - Reverted removal of `debuglog` dependency for compatibility with old versions of Node 0.12.
* 0.14.7 - Only generate sourcemap information in the compiler when `--debug` is set, for potential speed improvements when not using sourcemaps.
* 0.14.6 - Fixed output when `--jsx=preserve` is set.
* 0.14.5 - Removed `lodash` and `debuglog` dependencies.
* 0.14.4 - Fixed sourcemap paths when using Browserify's `basedir` option.
* 0.14.3 - Fixed `allowJs` option to enable transpiling ES6+ JS to ES5 or lower.
* 0.14.2 - Fixed `findConfigFile` for TypeScript 1.9 dev.
* 0.14.1 - Removed module mode override for ES6 mode (because CommonJS mode is now supported by TS 1.8).
* 0.14.0 - Updated to TypeScript 1.8 (thanks @joelday!)
* 0.13.2 - Fixed `findConfigFile` for use with the TypeScript 1.8 dev version.
* 0.13.1 - Fixed bug where `*.tsx` was not included in Browserify's list of extensions if the `jsx` option was set via `tsconfig.json`.
* 0.13.0 - Updated to TypeScript 1.7.
* 0.12.2 - Fixed resolution of entries outside of `process.cwd()` (thanks @pnlybubbles!)
* 0.12.1 - Updated `typescript` dependency to lock it down to version 1.6.x
* 0.12.0 - Updated to TypeScript 1.6.
* 0.11.16 - Updated `typescript` dependency to lock it down to version 1.5.x
* 0.11.15 - Added `*.tsx` to Browserify's list of extensions if `--jsx` is set (with priority *.ts > *.tsx > *.js).
* 0.11.14 - Override sourcemap settings with `--inlineSourceMap` and `--inlineSources` (because that's what Browserify expects).
* 0.11.13 - Fixed bug introduced in last change where non-entry point files were erroneously being excluded from the build.
* 0.11.12 - Fixed compilation when the current working directory is a symlink.
* 0.11.11 - Updated compiler host to support current TypeScript nightly.
* 0.11.10 - Updated resolution of `lib.d.ts` to support TypeScript 1.6 and to work with the `--typescript` option.
* 0.11.9 - Fixed dumb error.
* 0.11.8 - Handled JSX output from the TypeScript compiler to support `preserve`.
* 0.11.7 - Added `*.tsx` to the regex determining whether to run a file through the TypeScript compiler.
* 0.11.6 - Updated dependencies and devDependencies to latest.
* 0.11.5 - Fixed emit of `file` event to trigger watchify even when there are fatal compilation errors.
* 0.11.4 - Added `--typescript` option.
* 0.11.3 - Updated to TypeScript 1.5.
* 0.11.2 - Blacklisted `--out` and `--outDir` compiler options.
* 0.11.1 - Added `tsconfig.json` support.
* 0.11.0 - Altered behavior to pass through all compiler options to tsc by default.
* 0.10.2 - Fixed output of global error messages.  Fixed code generation in ES6 mode.
* 0.10.1 - Fixed display of nested error messages, e.g. many typing errors.
* 0.10.0 - Added `stopOnError` option and changed default behavior to continue building when there are typing errors.
* 0.9.0 - Updated to use TypeScript from npm (thanks @hexaglow!)
* 0.8.2 - Updated peerDependency for Browserify to allow any version >= 6.x.
* 0.8.1 - Updated peerDependency for Browserify 9.x.
* 0.8.0 - Updated to TypeScript 1.4.1.
* 0.7.1 - Updated peerDependency for Browserify 8.x.
* 0.7.0 - Updated error handling for compatibility with Watchify.
* 0.6.5 - Updated peerDependency for Browserify 7.x.
* 0.6.4 - Included richer file position information in syntax error messages.
* 0.6.3 - Updated to TypeScript 1.3.
* 0.6.2 - Included empty *.d.ts compiled files in bundle for Karma compatibility.
* 0.6.1 - Fixed compilation cache miss when given absolute filenames.
* 0.6.0 - Updated to TypeScript 1.1.
* 0.5.2 - Bugfix for 0.5.1 for files not included with expose.
* 0.5.1 - Handled *.d.ts files passed as entries. Fix for files included with expose.
* 0.5.0 - Updated to Browserify 6.x.
* 0.4.1 - Added npmignore to clean up published package.
* 0.4.0 - Dropped Browserify 4.x support. Fixed race condition causing pathological performance with some usage patterns, e.g. when used with [karma-browserify](https://github.com/Nikku/karma-browserify).
* 0.3.1 - Supported adding files with `bundler.add()`.
* 0.3.0 - Added Browserify 5.x support.
* 0.2.1 - Fixed paths for sources in sourcemaps.
* 0.2.0 - Made Browserify prioritize *.ts files over *.js files in dependency resolution.
* 0.1.4 - Handled case where the entry point is not a TypeScript file.
* 0.1.3 - Automatically added *.ts to Browserify's list of file extensions to resolve.
* 0.1.2 - Added sourcemap support.
* 0.1.1 - Fixed issue where intermediate *.js files were being written to disk when using `watchify`.
* 0.1.0 - Initial version.
