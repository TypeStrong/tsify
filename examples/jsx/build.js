const browserify = require('browserify');
const tsify = require('tsify');

browserify()
	.add('src/main.tsx')
	.add('typings/tsd.d.ts')
	.plugin(tsify)
	.bundle()
	.on('error', function (error) { console.error(error.toString()); })
	.pipe(process.stdout);
