function CompileError(info) {
    SyntaxError.call(this);

    var startPos = info.file.getLineAndCharacterOfPosition(info.start);

    this.fileName = info.file.fileName;
    this.line = startPos.line;
    this.column = startPos.character;
    this.name = 'TS' + info.code;
    this.message = info.file.fileName +
    	'(' + startPos.line + ',' + startPos.character + '): ' +
    	'TS' + info.code + ': ' +
    	info.messageText;
}

CompileError.prototype = Object.create(SyntaxError.prototype);

module.exports = CompileError;
