#!/usr/bin/env node

var program = require('commander'),
    pkg = require('../package.json'),
    packity = require('../index');

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
        packity(options, packity.cliReporter(options));
    });

// parse CLI
program.parse(process.argv);
