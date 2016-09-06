const browserify = require('browserify');
const proxyquire = require('proxyquireify');
const tsify = require('tsify');

browserify()
	.plugin(tsify)
	.plugin(proxyquire.plugin)
	.require(require.resolve('./src/foo-spec.ts'), { entry: true })
	.bundle()
	.pipe(process.stdout);
