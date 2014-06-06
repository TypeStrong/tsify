var Tsifier = require('./lib/Tsifier');

function tsify(b, opts) {
	var tsifier = new Tsifier(b, opts);
	b.on('bundle', tsifier.compileAndCacheFiles.bind(tsifier));
	b.transform(tsifier.transform.bind(tsifier));
};

module.exports = tsify;
