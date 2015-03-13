function CompileError(info) {
    SyntaxError.call(this);

	if (info.file) {
		var startPos = info.file.getLineAndCharacterFromPosition(info.start);

		this.fileName = info.file.filename;
		this.line = startPos.line;
		this.column = startPos.character;
		this.name = 'TS' + info.code;
		this.message = info.file.filename +
		'(' + startPos.line + ',' + startPos.character + '): ' +
		'TS' + info.code + ': ' +
		info.messageText;
	} else {
		this.name = 'TS' + info.code;
		this.message = 'TS' + info.code + ': ' + info.messageText;
	}

}

CompileError.prototype = Object.create(SyntaxError.prototype);

module.exports = CompileError;
