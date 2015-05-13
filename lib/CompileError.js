var os = require('os');
var ts = require('typescript');

function CompileError(diagnostic) {
	SyntaxError.call(this);

	var loc = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
	var category = ts.DiagnosticCategory[diagnostic.category];

	this.fileName = diagnostic.file.fileName;
	this.line = loc.line + 1;
	this.column = loc.character + 1;
	this.name = 'TypeScript error';
	this.message = this.fileName + '(' + this.line + ',' + this.column + '): ' +
		category + ' TS' + diagnostic.code + ': ' +
		ts.flattenDiagnosticMessageText(diagnostic.messageText, os.EOL);
}

CompileError.prototype = Object.create(SyntaxError.prototype);

module.exports = CompileError;
