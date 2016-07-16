# Making a new release

Write release notes in `README.md`. Then,

````
npm version <major|minor|path>
git push --follow-tags
npm publish
```

Enjoy life :heart: :rose:


# Debugging

Debug logging is enabled using the built in node `util`. We setup the `log` function as 

```
var log = require('util').debuglog(require('./package').name);
```

If you want this function to actually do something just set the environment variable `NODE_DEBUG=tsify` e.g. `NODE_DEBUG=tsify browserify ... etc.`
