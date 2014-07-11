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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiL1VzZXJzL2dyZWdzbS9jb2RlL3RzaWZ5L3Rlc3Qvbm9Bcmd1bWVudHMveC50cyIsIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS90ZXN0L25vQXJndW1lbnRzL3kudHMiLCIvVXNlcnMvZ3JlZ3NtL2NvZGUvdHNpZnkvdGVzdC9ub0FyZ3VtZW50cy96LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsc0JBQTBCO0FBQzFCLHNCQUEwQjtBQUMxQixDQUFDLENBQUMsYUFBYSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUFDOzs7QUNIbkIsU0FDUyxFQUFFLENBQUMsT0FBZTtJQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNyQixDQUFDO0FBSEQsbUJBQVksQ0FHWDs7OztBQ0hELFNBQ1MsRUFBRSxDQUFDLENBQVM7SUFDcEIsT0FBTyxDQUFDLEdBQUMsR0FBRztBQUNiLENBQUM7QUFIRCxtQkFBWSxDQUdYIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB5ID0gcmVxdWlyZSgnLi95Jyk7XG5pbXBvcnQgeiA9IHJlcXVpcmUoJy4veicpO1xueSgnaGVsbG8gd29ybGQnKTtcbnkoeigyKS50b1N0cmluZygpKTsiLCJleHBvcnQgPSBmbjtcbmZ1bmN0aW9uIGZuKG1lc3NhZ2U6IHN0cmluZykge1xuXHRjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn0iLCJleHBvcnQgPSBmbjtcbmZ1bmN0aW9uIGZuKG46IG51bWJlcikge1xuXHRyZXR1cm4gbioxMTE7XG59Il19
