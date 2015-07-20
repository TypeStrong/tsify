var _ = require('lodash');
var through = require('through2');

function tsify(b, opts) {
	var ts = opts.typescript || require('typescript');
	if (_.isString(ts)) { ts = require(ts); }

	var Tsifier = require('./lib/Tsifier')(ts);
	var tsifier = new Tsifier(opts);

	tsifier.on('error', function (error) {
		b.pipeline.emit('error', error);
	});
	tsifier.on('file', function (file) {
		b.emit('file', file);
	});

	setupPipeline();
	b.transform(tsifier.transform.bind(tsifier));

	b.on('reset', function () {
		setupPipeline();
	});

	function setupPipeline() {
		if (b._extensions.indexOf('.ts') === -1)
			b._extensions.unshift('.ts');

		b.pipeline.get('record').push(gatherEntryPoints());
		b.pipeline.get('deps').push(emitFiles());
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
			tsifier.reset();
			tsifier.generateCache(rows.map(function (row) { return row.file || row.id; }));
			rows.forEach(function (row) { self.push(row); });
			self.push(null);
			next();
		}
	}

	function emitFiles() {
		return through.obj(transform, flush);

		function transform(row, enc, next) {
			this.push(row);
			next();
		}

		function flush(next) {
			this.push(null);
			tsifier.emitFiles();
			next();
		}
	}
}

module.exports = tsify;
