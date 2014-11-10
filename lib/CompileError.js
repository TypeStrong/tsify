function CompileError(info) {
    SyntaxError.call(this);

    var startPos = info.file.getLineAndCharacterFromPosition(info.start);

    this.fileName = info.file.filename;
    this.line = startPos.line;
    this.column = startPos.character;
    this.name = 'TS' + info.code;
    this.message = info.messageText;
}

CompileError.prototype = Object.create(SyntaxError.prototype);

module.exports = CompileError;
