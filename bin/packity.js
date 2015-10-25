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
	// .option('-q, --quiet',  'do not show terminal messages')
	.option('-s, --suppress', 'suppress exit code')
	.action(function(path, options) {
		options.path = path;

		packity(options, function (err, result) {

		});
	});

// parse CLI
program.parse(process.argv);