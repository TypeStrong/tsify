var Tsifier = require('./lib/Tsifier');

function tsify(b, opts) {
	var tsifier = new Tsifier(opts);
	tsifier.on('error', function (error) { b.emit('error', error); });
	b.on('bundle', function () { tsifier.compileAndCacheFiles(b._entries); });
	b.transform(tsifier.transform.bind(tsifier));
};

module.exports = tsify;
