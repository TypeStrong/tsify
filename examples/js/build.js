const browserify = require('browserify');
const tsify = require('tsify');

browserify()
	.add('src/main.js')
	.plugin(tsify, { allowJs: true })
	.bundle()
	.on('error', function (error) { console.error(error.toString()); })
	.pipe(process.stdout);
