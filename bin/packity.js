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
    .option('-s, --suppress', 'suppress exit code')
    .action(function(path, options) {
        options.path = path;

        packity(options, function (err, result) {
            if (err) {
                if (!options.supress) { throw err; }
                !options.quiet && log('err! %s'.red, err && err.message || err);
            }

            var failure = false;

            // banner
            !options.quiet && log('%s v%s\n'.yellow, result.package.name, result.package.version);

            Object.keys(result.status).forEach(function (name) {
                var stat = result.status[name];

                if (stat.ok) {
                    !options.quiet && log(' ✓ %s (%s)'.dim, name, stat.message);
                }
                else {
                    !options.quiet && log(' ✗ %s (%s)'.red, name, stat.message);
                }
                !stat.ok && (failure = true);
            });

            if (failure) {
                !options.quiet && log('\nnot ok.'.red);
                !options.suppress && process.exit(1);
            }
            else {
                !options.quiet && log('\nok!'.green);
            }
        });
    });

// parse CLI
program.parse(process.argv);
