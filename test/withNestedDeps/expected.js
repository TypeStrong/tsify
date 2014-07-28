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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi90ZXN0L3dpdGhOZXN0ZWREZXBzL3gudHMiLCIuL3Rlc3Qvd2l0aE5lc3RlZERlcHMvbmVzdGVkL3R3aWNlL3oudHMiLCIuL3Rlc3Qvd2l0aE5lc3RlZERlcHMvbmVzdGVkL3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSw2QkFBaUM7QUFDakMsbUNBQXVDO0FBQ3ZDLENBQUMsQ0FBQyxhQUFhLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQUM7OztBQ0huQixTQUNTLEVBQUUsQ0FBQyxDQUFTO0lBQ3BCLE9BQU8sQ0FBQyxHQUFDLEdBQUc7QUFDYixDQUFDO0FBSEQsbUJBQVksQ0FHWDs7OztBQ0hELFNBQ1MsRUFBRSxDQUFDLE9BQWU7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQztBQUhELG1CQUFZLENBR1giLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwgImltcG9ydCB5ID0gcmVxdWlyZSgnLi9uZXN0ZWQveScpO1xuaW1wb3J0IHogPSByZXF1aXJlKCcuL25lc3RlZC90d2ljZS96Jyk7XG55KCdoZWxsbyB3b3JsZCcpO1xueSh6KDIpLnRvU3RyaW5nKCkpOyIsICJleHBvcnQgPSBmbjtcbmZ1bmN0aW9uIGZuKG46IG51bWJlcikge1xuXHRyZXR1cm4gbioxMTE7XG59IiwgImV4cG9ydCA9IGZuO1xuZnVuY3Rpb24gZm4obWVzc2FnZTogc3RyaW5nKSB7XG5cdGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufSJdfQ==
