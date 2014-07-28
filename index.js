var Tsifier = require('./lib/Tsifier');

function tsify(b, opts) {
	var tsifier = new Tsifier(opts);
	tsifier.on('error', function (error) { b.emit('error', error); });

	b.on('bundle', function () {
		tsifier.clearCompilationCache();
		tsifier.compileAndCacheFiles(b._entries.filter(Tsifier.isTypescript));
	});

	b.transform(tsifier.transform.bind(tsifier));

	if (b._extensions.indexOf('.ts') === -1)
		b._extensions.unshift('.ts');
};

module.exports = tsify;
