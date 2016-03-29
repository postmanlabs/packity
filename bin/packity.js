#!/usr/bin/env node

require('colors');

var program = require('commander'),
    pkg = require('../package.json'),
    packity = require('../index'),

    log = function () {
        console.log.apply(console, arguments);
    };

program
    .version(pkg.version)
    .description(pkg.description);

program
    .command('check <path>')
    .description('Checks whether a node module has correct dependencies installed')
    .option('-d, --dev',  'check dev dependencies')
    .option('-q, --quiet',  'packity becomes less chatty')
    .option('-q, --quiet',  'packity becomes less chatty')
    .option('-s, --summary',  'show end summary')
    .option('-x, --exit-code', 'suppress exit code')
    .action(function(path, options) {
        options.path = path;

        packity(options, function (err, result) {
            if (err) {
                if (!options.supress) { throw err; }
                !options.quiet && log('err! %s'.red, err && err.message || err);
            }

            var failure = false,
            	logPackages = !options.quiet && !options.summary;

            // banner
            !options.quiet && log('%s v%s'.yellow, result.package.name, result.package.version);

            Object.keys(result.status).forEach(function (name) {
                var stat = result.status[name];

                if (stat.ok) {
                    logPackages && log('  ✓ '.green + '%s v%s (%s)', name, stat.installed, stat.message);
                }
                else {
                    !log.quiet && log('  ✗ %s%s (%s; required v%s)'.red, name, stat.installed ? 
                    	(' v' + stat.installed) : '', stat.message, stat.required);
                }
                !stat.ok && (failure = true);
            });

            if (failure) {
                !options.quiet && log('not ok.'.red.bold);
                !options.exitCode && process.exit(1);
            }
            else {
                !options.quiet && log('ok!'.green.bold);
            }
        });
    });

// parse CLI
program.parse(process.argv);
