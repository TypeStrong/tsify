import y = require('./nested/y');
import z = require('./nested/twice/z');
y('hello world');
y(z(2).toString());