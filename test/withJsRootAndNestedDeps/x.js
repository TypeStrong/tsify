var y = require('./nested/y');
var z = require('./nested/twice/z');
y('hello world');
y(z(2).toString());
