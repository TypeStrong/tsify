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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9ncmVnc20vY29kZS90c2lmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi90ZXN0L3dpdGhBZGphY2VudENvbXBpbGVkRmlsZXMveC50cyIsIi4vdGVzdC93aXRoQWRqYWNlbnRDb21waWxlZEZpbGVzL3kudHMiLCIuL3Rlc3Qvd2l0aEFkamFjZW50Q29tcGlsZWRGaWxlcy96LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsc0JBQTBCO0FBQzFCLHNCQUEwQjtBQUMxQixDQUFDLENBQUMsYUFBYSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztBQUFDOzs7QUNIbkIsU0FDUyxFQUFFLENBQUMsT0FBZTtJQUMxQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNyQixDQUFDO0FBSEQsbUJBQVksQ0FHWDs7OztBQ0hELFNBQ1MsRUFBRSxDQUFDLENBQVM7SUFDcEIsT0FBTyxDQUFDLEdBQUMsR0FBRztBQUNiLENBQUM7QUFIRCxtQkFBWSxDQUdYIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB5ID0gcmVxdWlyZSgnLi95Jyk7XG5pbXBvcnQgeiA9IHJlcXVpcmUoJy4veicpO1xueSgnaGVsbG8gd29ybGQnKTtcbnkoeigyKS50b1N0cmluZygpKTsiLCJleHBvcnQgPSBmbjtcbmZ1bmN0aW9uIGZuKG1lc3NhZ2U6IHN0cmluZykge1xuXHRjb25zb2xlLmxvZyhtZXNzYWdlKTtcbn0iLCJleHBvcnQgPSBmbjtcbmZ1bmN0aW9uIGZuKG46IG51bWJlcikge1xuXHRyZXR1cm4gbioxMTE7XG59Il19
