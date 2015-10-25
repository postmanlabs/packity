var pkgInfo = require('./lib/packageinfo').
    semver = require('semver');

module.exports = function (options, callback) {
    !options && (options = {});

    pkgInfo(options.path, function (err, packages) {
	if (err) { return callback(err); }

	// ensure all dependencies are present
	
    });

};
