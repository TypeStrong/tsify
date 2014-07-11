(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function fn(n) {
    return n * 111;
}
module.exports = fn;


},{}],2:[function(require,module,exports){
function fn(message) {
    console.log(message);
}
module.exports = fn;


},{}],3:[function(require,module,exports){
var y = require('./nested/y');
var z = require('./nested/twice/z');
y('hello world');
y(z(2).toString());


},{"./nested/twice/z":1,"./nested/y":2}]},{},[3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2dyZWdzbS9jb2RlL3RzaWZ5L3Rlc3Qvd2l0aE5lc3RlZERlcHMvbmVzdGVkL3R3aWNlL3oudHMiLCIvVXNlcnMvZ3JlZ3NtL2NvZGUvdHNpZnkvdGVzdC93aXRoTmVzdGVkRGVwcy9uZXN0ZWQveS50cyIsIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS90ZXN0L3dpdGhOZXN0ZWREZXBzL3gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxTQUNTLEVBQUUsQ0FBQyxDQUFTO0lBQ3BCLE9BQU8sQ0FBQyxHQUFDLEdBQUc7QUFDYixDQUFDO0FBSEQsbUJBQVksQ0FHWDs7OztBQ0hELFNBQ1MsRUFBRSxDQUFDLE9BQWU7SUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQztBQUhELG1CQUFZLENBR1g7Ozs7QUNIRCw2QkFBaUM7QUFDakMsbUNBQXVDO0FBQ3ZDLENBQUMsQ0FBQyxhQUFhLENBQUM7QUFDaEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiZXhwb3J0ID0gZm47XG5mdW5jdGlvbiBmbihuOiBudW1iZXIpIHtcblx0cmV0dXJuIG4qMTExO1xufSIsImV4cG9ydCA9IGZuO1xuZnVuY3Rpb24gZm4obWVzc2FnZTogc3RyaW5nKSB7XG5cdGNvbnNvbGUubG9nKG1lc3NhZ2UpO1xufSIsImltcG9ydCB5ID0gcmVxdWlyZSgnLi9uZXN0ZWQveScpO1xuaW1wb3J0IHogPSByZXF1aXJlKCcuL25lc3RlZC90d2ljZS96Jyk7XG55KCdoZWxsbyB3b3JsZCcpO1xueSh6KDIpLnRvU3RyaW5nKCkpOyJdfQ==
