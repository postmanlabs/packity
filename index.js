var _ = require('lodash'),
    $ = require('async'),
    semver = require('semver'),
    fs = require('fs'),
    joinpath = require('path').join,
    resolvepath = require('path').resolve,

    E = '',
    HIDDEN_FILE_REGEX = /^[^\.]/,
    GIT_URL = /^git(\+(ssh|https?))?:\/\//i,
    GIT_URL_PREFIX = /^[\s\S]+#([\s\S]+)$/,
    REQUIRED_PACKAGE_DATA = ['name', 'version', 'dependencies', 'devDependencies'],
    MODULE_FOLDER_NAME = 'node_modules',
    PACKAGE_FILE_NAME = 'package.json',
    PACKAGE_NAME_KEY = 'name',
    PACKAGE_ANY_DEP_MATCH = '*',

    STATUS_MESSAGES = {
        '0': 'unknown',
        '1': 'ok',
        '2': 'not ok',
        '4': 'installed',
        '8': 'not installed'
    },

    defaultOptions = {
        path: '',
        dev: false
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

        // prepare dependencies (normalise git versions)
        function (package, modules, done) {
            done(null, _.mapValues(_.merge(package.dependencies, options.dev && package.devDependencies), 
                function (dependency) {
                    var search;

                    if (GIT_URL.test(dependency)) {
                        search = dependency.match(GIT_URL_PREFIX);
                        // if semver is found extract it and drop the 'v' prefix
                        search && search[1] && (search = semver.valid(search[1].replace(/^v/, E)));
                        console.log(dependency, search);
                        return search || null;
                    }
                    return dependency;
                }), package, modules);
        },

        // check status for dependencies and dev dependencies defined within package with respect to installed
        // modules
        function (dependencies, package, modules, done) {
            done(null, {
                package: package,
                installed: modules,
                // while caluclating status merge dependencies and dev dependencies if options are specified
                status: _.mapValues(dependencies, function (version, dependency) {
                    var installed = modules[dependency] || {},
                        // 0 = unknown
                        // 1 = installed ok
                        // 2 = installed not ok
                        // 4 = installed un-matchable
                        // 8 = not installed
                        code = 0;
                    
                    // if package is not installed then we have a failure else check if semver is valid
                    if (!installed[PACKAGE_NAME_KEY]) { // not installed
                        code = 8;
                    }
                    else if (version === null) { // not matchable
                        code = 4;
                    }
                    else if (installed.version && version) { // all versions available
                        code = semver.satisfies(installed.version, version) ? 1 : 2;
                    }

                    return {
                        ok: (code === 1 || code === 4),
                        code: code,
                        message: STATUS_MESSAGES[code],
                        required: version,
                        installed: installed.version
                    };
                })
            });
        }
    ], callback);
};
