(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyJfcHJlbHVkZS5qcyIsIngudHMiLCJ5LnRzIiwiei50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLHNCQUEwQjtBQUMxQixzQkFBMEI7QUFDMUIsQ0FBQyxDQUFDLGFBQWEsQ0FBQztBQUNoQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFBQzs7O0FDSG5CLFNBQ1MsRUFBRSxDQUFDLE9BQWU7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQztBQUhELG1CQUFZLENBR1g7Ozs7QUNIRCxTQUNTLEVBQUUsQ0FBQyxDQUFTO0lBQ3BCLE9BQU8sQ0FBQyxHQUFDLEdBQUc7QUFDYixDQUFDO0FBSEQsbUJBQVksQ0FHWCIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHkgPSByZXF1aXJlKCcuL3knKTtcbmltcG9ydCB6ID0gcmVxdWlyZSgnLi96Jyk7XG55KCdoZWxsbyB3b3JsZCcpO1xueSh6KDIpLnRvU3RyaW5nKCkpOyIsImV4cG9ydCA9IGZuO1xuZnVuY3Rpb24gZm4obWVzc2FnZTogc3RyaW5nKSB7XG5cdGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufSIsImV4cG9ydCA9IGZuO1xuZnVuY3Rpb24gZm4objogbnVtYmVyKSB7XG5cdHJldHVybiBuKjExMTtcbn0iXX0=
