(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Class1 = (function () {
    function Class1(name) {
        this.name = name;
    }
    Class1.prototype.WhoAreYou = function () {
        return this.name;
    };
    return Class1;
})();
exports.Class1 = Class1;
},{}],2:[function(require,module,exports){
var module1_1 = require("./module1");
//import math = require("mathjs");
var Class2 = (function () {
    function Class2() {
        var t = new module1_1.Class1("test");
        console.log(t.WhoAreYou());
        var fraction = math.fraction(1, 4);
    }
    return Class2;
})();
},{"./module1":1}],3:[function(require,module,exports){

},{}]},{},[2,3]);
