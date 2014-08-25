var Tsifier = require('./lib/Tsifier');

function tsify(b, opts) {
	var tsifier = new Tsifier(opts);
	tsifier.on('error', function (error) { b.emit('error', error); });

	var files = [];

	b.on('file', function(f) {
		files.push(f);
	});

	b.on('bundle', function () {
		tsifier.clearCompilationCache();
		tsifier.compileAndCacheFiles((b._entries || b._options.entries || files).filter(Tsifier.isTypescript));
	});

	b.transform(tsifier.transform.bind(tsifier));

	if (b._extensions.indexOf('.ts') === -1)
		b._extensions.unshift('.ts');
};

module.exports = tsify;
