var _ = require('lodash'),
    colors = require('colors/safe'),
    async = require('async'),
    semver = require('semver'),
    fs = require('fs'),
    format = require('util').format
    joinpath = require('path').join,
    resolvepath = require('path').resolve,

    E = '',
    HIDDEN_FILE_REGEX = /^[^\.]/,
    GIT_URL = /^git(\+(ssh|https?))?:\/\//i,
    GIT_URL_PREFIX = /^[\s\S]+#([\s\S]+)async/,
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
    },

    log = function () {
        process.stdout.write(format.apply(this, arguments) + '\n');
    };

module.exports = function (options, callback) {
    // prepare options
    options = _.defaults(options || {}, defaultOptions);

    async.waterfall([
        // prepare options
        function (done) {
            options = _.defaults(options || {}, defaultOptions);

            // do not allow if path is not provided
            if (!options.path) {
                return done(new Error('packity: invalid module path: "' + options.path + '"'));
            }

            done();
        },

        // load root package file and return result to callback
        function (done) {
            done(null, _.pick(require(resolvepath(options.path, PACKAGE_FILE_NAME)), REQUIRED_PACKAGE_DATA));
        },

        // prepare dependencies (normalise git versions)
        function (package, done) {
            done(null, _.mapValues(_.merge(package.dependencies, options.dev && package.devDependencies),
                function (dependency) {
                    var search;

                    if (GIT_URL.test(dependency)) {
                        search = dependency.match(GIT_URL_PREFIX);
                        // if semver is found extract it and drop the 'v' prefix
                        search && search[1] && (search = semver.valid(search[1].replace(/^v/, E)));
                        return search || null;
                    }
                    return dependency;
                }), package);
        },

        // reduce the package file paths to the ones that exist
        function (dependencies, package, done) {
            var packageFiles = _.map(Object.keys(dependencies), function (dir) {
                return resolvepath(options.path, MODULE_FOLDER_NAME, dir, PACKAGE_FILE_NAME);
            });

            async.filter(packageFiles, fs.exists, _.bind(done, this, null, dependencies, package));
        },

         // get all package file data in each module directory
        function (dependencies, package, packageFiles, done) {
            async.map(packageFiles, function (file, next) {
                next(null, _.pick(require(file), REQUIRED_PACKAGE_DATA));
            }, function (err, modules) {
                return done(err, dependencies, package, modules);
            });
        },

        // check status for dependencies and dev dependencies defined within package with respect to installed
        // modules
        function (dependencies, package, modules, done) {
            done(null, {
                package: package,
                installed: modules,
                // while calculating status merge dependencies and dev dependencies if options are specified
                status: _.mapValues(dependencies, function (version, dependency) {
                    var installed = _.find(modules, function (module) { return module.name ===dependency }) || {},
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

// add cli parser
module.exports.cliReporter = function (options, callback) {
    return function (err, result) {
        if (err) {
            if (!options.supress) { 
                if (callback) {
                    return callback(err, result);
                }
                else {
                    throw err; 
                }
            }
            !options.quiet && log(colors.red('err! %s'), err && err.message || err);
        }

        var failure = false,
            logPackages = !options.quiet && !options.summary;

        // banner
        !options.quiet && log(colors.yellow('%s v%s'), result.package.name, result.package.version);

        _.keys(result.status).forEach(function (name) {
            var stat = result.status[name];

            if (stat.ok) {
                logPackages && log(colors.green('  ✓ ') + '%s v%s (%s)', name, stat.installed, stat.message);
            }
            else {
                !log.quiet && log(colors.red('  ✗ %s%s (%s; required v%s)'), name, stat.installed ? 
                    (' v' + stat.installed) : '', stat.message, stat.required);
            }
            !stat.ok && (failure = true);
        });

        if (failure) {
            !options.quiet && log(colors.bold.red('not ok.'));
            callback ? callback(new Error('package check failed'), result) : (!options.exitCode && process.exit(1));
        }
        else {
            !options.quiet && log(colors.bold.green('ok!'));
            callback(null, result);
        }
    };
};