(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/// <reference path="node-foo.d.ts" />
var foo = require('node-foo');
console.log(foo.foo_aaa('this'));
console.log(foo.foo_bbb('is a'));
console.log(foo.foo_ccc('test'));

},{"node-foo":2}],2:[function(require,module,exports){
/**
 * node-foo <https://github.com/jonschlinkert/node-foo>
 *
 * Copyright (c) 2014 Jon Schlinkert, contributors.
 * Licensed under the MIT license.
 */

exports.foo_aaa = function(str) {
  return 'node-foo aaa:' + str;
};

exports.foo_bbb = function(str) {
  return 'node-foo bbb:' + str;
};

exports.foo_ccc = function(str) {
  return 'node-foo ccc:' + str;
};
},{}]},{},[1])
//# sourceMappingURL=expected.js.map
