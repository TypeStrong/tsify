var Tsifier = require('./lib/Tsifier');
var through = require('through2');

function tsify(b, opts) {
	var tsifier = new Tsifier(opts);
	tsifier.on('error', function (error) { b.emit('error', error); });

	setupPipeline();
	b.transform(tsifier.transform.bind(tsifier));

	b.on('reset', function () {
		setupPipeline();
	});

	function setupPipeline() {
		if (b._extensions.indexOf('.ts') === -1)
			b._extensions.unshift('.ts');

		b.pipeline.get('record').push(gatherDeps());
	}

	function gatherDeps() {
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
}

module.exports = tsify;
