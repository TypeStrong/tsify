var Tsifier = require('./lib/Tsifier');
var through = require('through2');

function tsify(b, opts) {
	var tsifier = new Tsifier(opts);
	tsifier.on('error', function (error) { b.emit('error', error); });

	setupPipeline();
	b.transform(tsifier.transform.bind(tsifier));

	b.on('reset', function () {
		tsifier.clearCompilationCache();
		setupPipeline();
	});

	function setupPipeline() {
		if (b._extensions.indexOf('.ts') === -1)
			b._extensions.unshift('.ts');

		b.pipeline.get('record').push(gatherDeps(function (files) {
			tsifier.compileAndCacheFiles(files);
		}));
	}
};

module.exports = tsify;

function gatherDeps(cb) {
	var rows = [];
	return through.obj(transform, flush);

	function transform(row, enc, next) {
		rows.push(row);
		next();
	}

	function flush(next) {
		cb(rows.map(function (row) { return row.id; }));
		rows.forEach(this.push.bind(this));
		this.push(null);
		next();
	}
}