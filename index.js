'use strict';

var realpath = require('fs.realpath');
var log      = require('util').debuglog(require('./package').name);
var through  = require('through2');
var path     = require('path');

function tsify(b, opts) {

	if (typeof b === 'string') {
		throw new Error('tsify appears to have been configured as a transform; it must be configured as a plugin.');
	}
	var ts = opts.typescript || require('typescript');
	if (typeof ts === 'string' || ts instanceof String) {
		ts = require(ts);
	}

	var Tsifier = require('./lib/Tsifier')(ts);
	var tsifier = new Tsifier(opts, b._options);

	tsifier.on('error', function (error) {
		b.pipeline.emit('error', error);
	});
	tsifier.on('file', function (file, id) {
		b.emit('file', file, id);
	});

	setupPipeline();

	var transformOpts = {
		global: opts.global
	};
	b.transform(tsifier.transform.bind(tsifier), transformOpts);

	b.on('reset', function () {
		setupPipeline();
	});

	function setupPipeline() {
		if (tsifier.opts.jsx && b._extensions.indexOf('.tsx') === -1)
			b._extensions.unshift('.tsx');

		if (b._extensions.indexOf('.ts') === -1)
			b._extensions.unshift('.ts');

		b.pipeline.get('record').push(gatherEntryPoints());
	}

	function gatherEntryPoints() {
		var rows = [];
		return through.obj(transform, flush);

		function transform(row, enc, next) {
			rows.push(row);
			next();
		}

		function flush(next) {
			var self = this;
			var ignoredFiles = [];
			var entryFiles = rows
				.map(function (row) {
					var file = row.file || row.id;
					if (file) {
						if (row.source !== undefined) {
							ignoredFiles.push(file);
						} else if (row.basedir) {
							return path.resolve(row.basedir, file);
						} else if (path.isAbsolute(file)) {
							return file;
						} else {
							ignoredFiles.push(file);
						}
					}
					return null;
				})
				.filter(function (file) { return file; })
				.map(function (file) { return realpath.realpathSync(file); });
			if (entryFiles.length) {
				log('Files from browserify entry points:');
				entryFiles.forEach(function (file) { log('  %s', file); });
			}
			if (ignoredFiles.length) {
				log('Ignored browserify entry points:');
				ignoredFiles.forEach(function (file) { log('  %s', file); });
			}
			tsifier.reset();
			tsifier.generateCache(entryFiles, ignoredFiles);
			rows.forEach(function (row) { self.push(row); });
			self.push(null);
			next();
		}
	}
}

module.exports = tsify;
