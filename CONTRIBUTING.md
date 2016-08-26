# Making a new release

Write release notes in `README.md`. Then,

```
npm version <major|minor|patch>
git push --follow-tags
npm publish
```

Enjoy life :heart: :rose:


# Debugging

Debug logging is enabled using the built in node `util`. We setup the `log` function as 

```
var log = require('util').debuglog(require('./package').name);
```

If you want this function to actually do something just set the environment variable `NODE_DEBUG=tsify` e.g.

```
NODE_DEBUG=tsify browserify ... etc.
```


# Internals and processing flow

`tsify` is a implemented as a Browserify [plugin](https://github.com/substack/browserify-handbook#plugins) - not as a [transform](https://github.com/substack/browserify-handbook#writing-your-own) - because it needs access to the Browserify bundler - which is passed to plugins, but not to transforms. Access to the bundler is required so that `tsify` can include the TypeScript extensions in the `_extensions` array used by Browserify when resolving modules and so that `tsify` can listen to events associated with the Browserify pipeline. That's not possible with a transform, as a transform receives only a file path and a stream of content.

However, `tsify` does implement a transform that is wired up internally.

## `index.js` - the plugin

* It wires up internal transform.
* It wires up the `file` and `reset` events. (Note that the `file` is [informational nicety](https://github.com/substack/node-browserify#events); it's not a core part of the Browserify process.)
* It places `.ts(x)` extensions at the *head* of Browserify's extensions array.
* It gathers the Browserify entry point files.

## `lib/Tsifier.js` - the transform

* The `Tsifer` is a Browserify transform.
* It returns compiled content to Browserify.
* It parses the `tsconfig.json` for options and files.
* It configures the TypeScipt `rootDir` and `outDir` options to use an imaginary `/__tsify__` directory.
* It creates the `Host`, passing it to the TypeScript Compiler API to compile the program and check the syntax, semantics and output.

## `lib/Host.js` - the TypeScript host

* The `Host` is a TypeScript Compiler API host.
* It abstracts the reading and writing of files, etc.
* It parses and caches the parsed source files, reading them from disk.
* It caches the compiled files when the TypeScript Compiler API writes compiled content.

## Processing flow

* When Browserify's pipeline is prepared, the initial list of files to be compiled is obtained from the `tsconfig.json` and from the Browserify entry points.
* With the pipeline prepared, Browserify starts processing its entry points, passing their content through the `Tsifier` transform.
* To obtain the transformed content, the `Tsifier` transform looks in a cache for the compiled content.
* If the cache look up results in a miss, the transformed file is added to the list of files (if it's missing from the list) and a compilation of the list of files is performed.
* Note that with TypeScript using the same module resolution mechanism as Browserify (`"moduleResolution": "node"`) only a single compilation is required.
* Browserify then locates any `require` calls in the transformed content and passes the content for these dependencies through the `Tsifier` transform.
* This continues until all dependencies have been processed.

## Caveats

* The `Host` reads the source from disk; the content passed into the `Tsifier` transform is ignored. That means that any transforms added before the `tsify` plugin will be ineffectual.
* If `grunt-browserify` is used, declarative configurations will see transforms will be loaded before plugins. To avoid that, an imperative configuration that uses the [configure](https://github.com/jmreidy/grunt-browserify#configure) function would be necessary.
