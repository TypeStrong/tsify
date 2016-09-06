const proxyquire = require('proxyquireify')(require);
require = function (name) {
    const stubs = {
        './bar': {
            kinder: function () { return 'schokolade'; },
            wunder: function () { return 'wirklich wunderbar'; }
        }
    };
    return proxyquire(name, stubs);
} as NodeRequire;

import foo from './foo';
import { wurst } from './baz';

console.log(foo());
console.log(wurst());
