var _ = require('lodash'),
    $ = require('async'),
    fs = require('fs'),
    joinpath = require('path').join,
    resolvepath = require('path').resolve;

module.exports = function (options, callback) {
    options = _.merge({
        path: __dirname
    }, options);

    var path = options.path,
        pkg;

    // get root package
    try {
        pkg = require(resolvepath(path, 'package.json'));
        pkg = pkg && {
            name: pkg.name,
            version: pkg.version,
            dependencies: pkg.dependencies,
            devDependencies: pkg.devDependencies
        };
    }
    catch (e) {
        return callback(new Error('root package loading error: ' + e.message || e));
    }
    
    // append node_modules folder to path
    path = resolvepath(path, 'node_modules');

    $.waterfall([
        // fetch node module directories
        function (done) {
            fs.readdir(path, done);
        },

        // remove hidden directories
        function (dirs, done) {
	    done(null, _.filter(dirs, function (dir) {
                return !/^\./g.test(dir);
            }));
        },

        // get the package file names
        function (dirs, done) {
            done(null,  _.map(dirs, function (dir) {
	        return joinpath(path, dir, 'package.json');
	    }));
        },

        // get all package file json
        function (files, done) {
	    $.map(files, function (file, next) {
	        // we perform the mapping in atry-catch block so that we can simply ignore
                // any error we encounter while reading the package file
  	        try {
                    next(null, require(file));
	        }
	        catch (e) { next(null); } // in case of error we move on
            }, done);
        },

        // remove invalid packages
        function (files, done) {
	    done(null, _(files).map(function (file) {
	        return file && { name: file.name, version: file.version };
            }).compact().value());
        }
    ], function (err, modules) {
        callback(err, !err && {
            package: pkg,
            modules: _.indexBy(modules, 'name')
        });
    });
};

module.exports({ path: './' }, console.log);
