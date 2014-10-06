(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var y = require('./nested/y');
var z = require('./nested/twice/z');
y('hello world');
y(z(2).toString());


},{"./nested/twice/z":2,"./nested/y":3}],2:[function(require,module,exports){
function fn(n) {
    return n * 111;
}
module.exports = fn;


},{}],3:[function(require,module,exports){
function fn(message) {
    console.log(message);
}
module.exports = fn;


},{}]},{},[1])

//# sourceMappingURL=expected.js.map