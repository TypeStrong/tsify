var fs = require('fs-extra');
var path = require('path');

var tscFile = require.resolve('typescript');
var outputPath = './lib/tsc';

var contents = fs.readFileSync(tscFile, 'utf-8');
contents = contents.replace(
	/ts\.executeCommandLine\(sys\.args\);(?=\s*$)/,
	'module.exports = ts;');
fs.writeFileSync(path.join(outputPath, 'tsc.js'), contents);

fs.copySync(path.dirname(tscFile), outputPath, isDeclarationFile);

function isDeclarationFile(f) {
	return f.match(/\.d\.ts$/);
}
