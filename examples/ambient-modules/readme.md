`browserify src/module2.ts typings/browser.d.ts -p [ tsify --noImplicitAny ] > bundle.js`

Will combine modules but NOT include mathjs in the bundle