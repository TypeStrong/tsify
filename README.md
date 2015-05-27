# tsify

[Browserify](http://browserify.org/) plugin for compiling [TypeScript](http://www.typescriptlang.org/)

[![NPM version](https://img.shields.io/npm/v/tsify.svg)](https://www.npmjs.com/package/tsify)
[![Build status](https://img.shields.io/travis/smrq/tsify.svg)](http://travis-ci.org/smrq/tsify)
[![Dependency status](https://img.shields.io/david/smrq/tsify.svg)](https://david-dm.org/smrq/tsify)
[![devDependency Status](https://img.shields.io/david/dev/smrq/tsify.svg)](https://david-dm.org/smrq/tsify#info=devDependencies)
[![peerDependency Status](https://img.shields.io/david/peer/smrq/tsify.svg)](https://david-dm.org/smrq/tsify#info=peerDependencies)

# Example Usage

### Command line:

``` sh
$ browserify main.ts -p [ tsify --noImplicitAny ] > bundle.js
```

### Browserify API:

``` js
var browserify = require('browserify');
var tsify = require('tsify');

browserify()
    .add('main.ts')
    .plugin('tsify', { noImplicitAny: true })
    .bundle()
    .pipe(process.stdout);
```

# Installation

Just plain ol' [npm](https://npmjs.org/) installation:

### 1. Install browserify
```sh
npm install browserify
```

### 2. Install tsify
``` sh
npm install tsify
```

For use on the command line, use the flag `npm install -g`.

# Options

* **tsify** will generate sourcemaps if the `--debug` option is set on Browserify.
* **tsify** supports almost all options from the TypeScript compiler.  Notable exceptions:
	* `-d, --declaration` - See [tsify#15](https://github.com/smrq/tsify/issues/15)
	* `-m, --module` - This is defaulted to CommonJS automatically (or None when in ES6 mode).

# does this work with...

### Watchify?

Yes!  **tsify** can do incremental compilation using [watchify](//github.com/substack/watchify), resulting in much faster incremental build times.  Just follow the Watchify documentation, and add **tsify** as a plugin as indicated in the documentation above.

### Gulp?

No problem.  See the Gulp recipes on using [browserify](https://github.com/gulpjs/gulp/blob/master/docs/recipes/browserify-uglify-sourcemap.md) and [watchify](https://github.com/gulpjs/gulp/blob/master/docs/recipes/fast-browserify-builds-with-watchify.md), and add **tsify** as a plugin as indicated in the documentation above.

### Grunt?

Use [grunt-browserify](https://github.com/jmreidy/grunt-browserify) and you should be good!  Just add **tsify** as a plugin in your Grunt configuration.

### IE 11?

The inlined sourcemaps that Browserify generates [may not be readable by IE 11](//github.com/smrq/tsify/issues/19) for debugging purposes.  This is easy to fix by adding [exorcist](//github.com/thlorenz/exorcist) to your build workflow after Browserify.

# Why a plugin?

There are several TypeScript compilation transforms available on npm, all with various issues.  The TypeScript compiler automatically performs dependency resolution on module imports, much like Browserify itself.  Browserify transforms are not flexible enough to deal with multiple file outputs given a single file input, which means that any working TypeScript compilation transform either skips the resolution step (which is necessary for complete type checking) or performs multiple compilations of source files further down the dependency graph.

**tsify** avoids this problem by using the power of plugins to perform a single compilation of the TypeScript source up-front, using Browserify to glue together the resulting files.

# License

MIT

# Changelog

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
