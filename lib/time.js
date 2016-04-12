var log = require('util').debuglog(require('../package').name);

function start() {
	return process.hrtime();
}
function stop(t0, message) {
	var tDiff = process.hrtime(t0);
	log('%d sec -- %s', (tDiff[0] + (tDiff[1] / 1000000000)).toFixed(4), message);
}

module.exports = { start: start, stop: stop };
