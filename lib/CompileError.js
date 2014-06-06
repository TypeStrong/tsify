function CompileError(fullMessage) {
    SyntaxError.call(this);
    var errorMessageRegex = /(.+)\((\d+),(\d+)\): error (TS\d+): (.+)/;
    var results = errorMessageRegex.exec(fullMessage);
    if (!results) {
    	this.message = fullMessage;
    } else {
    	this.fileName = results[1];
    	this.line = results[2];
    	this.column = results[3];
    	this.name = results[4];
    	this.message = results[5];
    }
}

CompileError.prototype = Object.create(SyntaxError.prototype);

module.exports = CompileError;
