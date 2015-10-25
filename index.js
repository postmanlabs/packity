var _ = require('lodash'),
    $ = require('async'),
    semver = require('semver'),
    fs = require('fs'),
    joinpath = require('path').join,
    resolvepath = require('path').resolve,

    HIDDEN_FILE_REGEX = /^[^\.]/,
    REQUIRED_PACKAGE_DATA = ['name', 'version', 'dependencies', 'devDependencies'],
    MODULE_FOLDER_NAME = 'node_modules',
    PACKAGE_FILE_NAME = 'package.json',
    PACKAGE_NAME_KEY = 'name',

    STATUS_MESSAGES = {
        'true': 'match',
        'false': 'mismatch',
        'null': 'unavailable',
        'undefined': 'unknown'
    },

    defaultOptions = {
        path: '',
        d: false
    };

module.exports = function (options, callback) {
    $.waterfall([
        // prepare options
        function (done) {
            options = _.defaults(options || {}, defaultOptions);

            // do not allow if path is not provided
            if (!options.path) {
                return done(new Error('packity: invalid module path: "' + options.path + '"'));
            }

            done();
        },

        // fetch node module directories
        function (done) {
            fs.readdir(resolvepath(options.path, MODULE_FOLDER_NAME), function (err, dirs) {
                // remove hidden directories
                done(err, !err && _.filter(dirs, RegExp.prototype.test, HIDDEN_FILE_REGEX));
            });
        },

        // transform the directories to paths of package.json
        function (dirs, done) {
            $.map(dirs, function (dir, next) {
                next(null, resolvepath(options.path, MODULE_FOLDER_NAME, dir, PACKAGE_FILE_NAME));
            }, done);
        },

        // reduce the package file paths to the ones that exist
        function (files, done) {
            $.filter(files, fs.exists, _.bind(done, this, null));
        },

        // get all package file data in each module directory
        function (files, done) {
            $.map(files, function (file, next) {
                next(null, _.pick(require(file), REQUIRED_PACKAGE_DATA));
            }, done);
        },

        // load root package and return result to callback
        function (modules, done) {
            done(null, _.pick(require(resolvepath(options.path, PACKAGE_FILE_NAME)), REQUIRED_PACKAGE_DATA), 
                _.indexBy(modules, PACKAGE_NAME_KEY));
        },

        // check status for dependencies and dev dependencies defined within package with respect to installed
        // modules
        function (package, modules, done) {
            done(null, {
                package: package,
                installed: modules,
                // while caluclating status merge dependencies and dev dependencies if options are specified
                status: _.mapValues(_.merge(package.dependencies, options.d && package.devDependencies), 
                    function (version, dependency) {
                        var ok = modules[dependency] ? semver.satisfies(modules[dependency].version, version) : null;
                        return {
                            ok: ok,
                            message: STATUS_MESSAGES[ok]
                        };
                    })
            });
        }
    ], callback);
};
