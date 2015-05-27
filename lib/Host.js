var fs = require('fs');
var log = require('debuglog')(require('../package').name);
var os = require('os');
var ts = require('typescript');

function Host(currentDirectory, languageVersion) {
	this.currentDirectory = currentDirectory;
	this.languageVersion = languageVersion;
	this.files = {};
	this.previousFiles = {};
	this.output = {};
	this.version = 0;
	this.error = false;

	var libDefaultPath = languageVersion === ts.ScriptTarget.ES6 ?
		require.resolve('typescript/bin/lib.es6.d.ts') :
		require.resolve('typescript/bin/lib.d.ts');
	var libDefaultContents = fs.readFileSync(libDefaultPath, 'utf-8');
	this.libDefault = ts.createSourceFile('__lib.d.ts', libDefaultContents, languageVersion, '0');
}

Host.prototype._reset = function () {
	this.previousFiles = this.files;
	this.files = {};
	this.output = {};
	this.error = false;
	++this.version;

	log('Resetting (version %d)', this.version);
};

Host.prototype._addFile = function (filename, root) {
	var normalized = ts.normalizePath(filename);

	var text;
	try {
		text = fs.readFileSync(filename, 'utf-8');
	} catch (ex) {
		return;
	}

	var file;
	if (this.previousFiles[normalized] &&
		this.previousFiles[normalized].contents === text) {
		file = this.previousFiles[normalized].ts;
		log('Reused file %s (version %s)', normalized, file.version);
	} else {
		file = ts.createSourceFile(filename, text, this.languageVersion, String(this.version));
		log('New version of source file %s (version %s)', normalized, file.version);
	}

	this.files[normalized] = {
		filename: filename,
		contents: text,
		ts: file,
		root: root
	};
	return file;
};

Host.prototype.getNewLine = function () {
	return os.EOL;
};

Host.prototype.useCaseSensitiveFileNames = function () {
	var platform = os.platform();
	return platform !== 'win32' && platform !== 'win64' && platform !== 'darwin';
};

Host.prototype.getCurrentDirectory = function () {
	return this.currentDirectory;
};

Host.prototype.getCanonicalFileName = function (filename) {
	return ts.normalizePath(filename);
};

Host.prototype.getDefaultLibFileName = function () {
	return '__lib.d.ts';
};

Host.prototype.writeFile = function (filename, data) {
	this.output[filename] = data;
};

Host.prototype.getSourceFile = function (filename) {
	var normalized = ts.normalizePath(filename);

	if (this.files[normalized])
		return this.files[normalized].ts;

	if (normalized === '__lib.d.ts')
		return this.libDefault;

	return this._addFile(filename, false);
};

Host.prototype.getFileData = function(filename) {
	var normalized = ts.normalizePath(filename);
	return this.files[normalized];
};

module.exports = Host;
