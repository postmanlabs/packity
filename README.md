# packity
(developmental) Sanity check of installed packages as per package.json

## Usage

### CLI

```terminal
npm install packity@beta -g;
packity check <module-folder>
```

> use `packity check --help` for more CLI options

### Module

```javascript
var packity = require('packity');
packity({ path: 'my-path', dev: true}, function (err, results) {
	// results look like
	// {
	//   "package": {} // name, version, dependencies
	//   "installed": {} // list of installed modules
	//   "status": {} // status of package dependencies with 'message', 'code', 'ok' keys.
	// }
	console.log(results);
});
```

