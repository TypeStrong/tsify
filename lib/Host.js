'use strict';

var commondir = require('commondir');
var events    = require('events');
var fs        = require('fs');
var log       = require('util').debuglog(require('../package').name);
var os        = require('os');
var path      = require('path');
var util      = require('util');

module.exports = function (ts) {
	function Host(currentDirectory, languageVersion) {
		this.currentDirectory = currentDirectory;
		this.languageVersion = languageVersion;
		this.files = {};
		this.previousFiles = {};
		this.output = {};
		this.version = 0;
		this.error = false;
	}

	util.inherits(Host, events.EventEmitter);

	Host.prototype._reset = function () {
		this.previousFiles = this.files;
		this.files = {};
		this.output = {};
		this.error = false;
		++this.version;

		log('Resetting (version %d)', this.version);
	};

	Host.prototype._normalizedRelative = function(filename) {
		return ts.normalizePath(path.relative(this.currentDirectory, path.resolve(filename)));
	};

	Host.prototype._addFile = function (filename, root) {
		var normalized = this._normalizedRelative(filename);
		log('Parsing %s (norm: %s)', filename, normalized);

		var text;
		try {
			text = fs.readFileSync(filename, 'utf-8');
		} catch (ex) {
			return;
		}

		var file;
		var current = this.files[normalized];
		var previous = this.previousFiles[normalized];
		var version;

		if (current && current.contents === text) {
			file = current.ts;
			version = current.version;
			log('Reused current file %s (version %d)', normalized, version);
		} else if (previous && previous.contents === text) {
			file = previous.ts;
			version = previous.version;
			log('Reused previous file %s (version %d)', normalized, version);
		} else {
			file = ts.createSourceFile(filename, text, this.languageVersion, true);
			version = this.version;
			log('New version of source file %s (version %d)', normalized, version);
		}

		this.files[normalized] = {
			filename: filename,
			contents: text,
			ts: file,
			root: root,
			version: version
		};

		this._emitFile(normalized);

		return file;
	};

	Host.prototype._emitFile = function (normalized) {
		var idPath = './' + normalized;
		var fullPath = path.resolve(idPath);
		this.emit('file', fullPath, idPath);
	}

	Host.prototype.getSourceFile = function (filename) {
		var normalized = this._normalizedRelative(filename);

		if (this.files[normalized])
			return this.files[normalized].ts;

		if (normalized === '__lib.d.ts')
			return this.libDefault;

		return this._addFile(filename, false);
	};

	Host.prototype.getDefaultLibFileName = function () {
		var libPath = path.dirname(ts.sys.getExecutingFilePath());
		var libFile = ts.getDefaultLibFileName({ target: this.languageVersion });
		return path.join(libPath, libFile);
	};

	Host.prototype.writeFile = function (filename, data) {
		var normalized = this._normalizedRelative(filename);
		log('Cache write %s (norm: %s)', filename, normalized);
		this.output[normalized] = data;
	};

	Host.prototype.getCurrentDirectory = function () {
		return this.currentDirectory;
	};

	Host.prototype.getCanonicalFileName = function (filename) {
		return this._normalizedRelative(filename);
	};

	Host.prototype.useCaseSensitiveFileNames = function () {
		var platform = os.platform();
		return platform !== 'win32' && platform !== 'win64' && platform !== 'darwin';
	};

	Host.prototype.getNewLine = function () {
		return os.EOL;
	};

	Host.prototype.fileExists = function (filename) {
		return ts.sys.fileExists(filename);
	};

	Host.prototype.readFile = function (filename) {
		var normalized = this._normalizedRelative(filename);
		return ts.sys.readFile(normalized);
	};

	Host.prototype._rootDir = function () {
		var dirs = [];
		for (var filename in this.files) {
			if (!Object.hasOwnProperty.call(this.files, filename)) continue;
			if (/\.d\.ts$/.test(filename)) continue;

			dirs.push(path.dirname(filename));
		}
		var result = commondir(this.currentDirectory, dirs);
		return result;
	};

	return Host;
};
