'use strict';

var os = require('os');

module.exports = function (ts) {
	function CompileError(diagnostic) {
		SyntaxError.call(this);

		this.message = '';

		if (diagnostic.file) {
			var loc = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
			this.fileName = diagnostic.file.fileName;
			this.line = loc.line + 1;
			this.column = loc.character + 1;
			this.message += this.fileName + '(' + this.line + ',' + this.column + '): ';
		}

		var category = ts.DiagnosticCategory[diagnostic.category];
		this.name = 'TypeScript error';
		this.message += category + ' TS' + diagnostic.code + ': ' +
			ts.flattenDiagnosticMessageText(diagnostic.messageText, os.EOL);
	}

	CompileError.prototype = Object.create(SyntaxError.prototype);

	return CompileError;
};
