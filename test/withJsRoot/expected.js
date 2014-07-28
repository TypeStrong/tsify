(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var y = require('./y');
var z = require('./z');
y('hello world');
y(z(2).toString());


},{"./y":2,"./z":3}],2:[function(require,module,exports){
function fn(message) {
    console.log(message);
}
module.exports = fn;


},{}],3:[function(require,module,exports){
function fn(n) {
    return n * 111;
}
module.exports = fn;


},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi90ZXN0L3dpdGhKc1Jvb3QveC5qcyIsIi4vdGVzdC93aXRoSnNSb290L3kudHMiLCIuL3Rlc3Qvd2l0aEpzUm9vdC96LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBLFNBQ1MsRUFBRSxDQUFDLE9BQWU7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQztBQUhELG1CQUFZLENBR1g7Ozs7QUNIRCxTQUNTLEVBQUUsQ0FBQyxDQUFTO0lBQ3BCLE9BQU8sQ0FBQyxHQUFDLEdBQUc7QUFDYixDQUFDO0FBSEQsbUJBQVksQ0FHWCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgeSA9IHJlcXVpcmUoJy4veScpO1xudmFyIHogPSByZXF1aXJlKCcuL3onKTtcbnkoJ2hlbGxvIHdvcmxkJyk7XG55KHooMikudG9TdHJpbmcoKSk7XG5cbiIsImV4cG9ydCA9IGZuO1xuZnVuY3Rpb24gZm4obWVzc2FnZTogc3RyaW5nKSB7XG5cdGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufSIsImV4cG9ydCA9IGZuO1xuZnVuY3Rpb24gZm4objogbnVtYmVyKSB7XG5cdHJldHVybiBuKjExMTtcbn0iXX0=
