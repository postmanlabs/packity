var expect = require('expect.js');

describe('core local install', function () {
	it('must not have errors', function (done) {
		require('../index')({ path: './' }, function (err, result) {
			expect(err).to.not.be.ok();
			expect(result).to.be.ok()
			done();
		});
	});

	it('must have valid package results', function (done) {
		require('../index')({ path: './' }, function (err, result) {
			expect(result.package).to.be.eql({
		        "name": "packity",
		        "version": "0.3.4",
		        "dependencies": {
							"async": "1.4.2",
							"colors": "1.4.0",
							"commander": "^2.9.0",
							"lodash": "^4.17.2",
							"readdir": "^0.0.13",
							"semver": "^5.0.3"
		        },
		        "devDependencies": {
							"expect.js": "^0.3.1",
							"mocha": "^3.2.0"
		        }
		    });
			done();
		});
	});

	it('must result having status', function (done) {
		require('../index')({ path: './', dev: true }, function (err, result) {
			expect(Object.keys(result.status)).to.be.eql([ 'async', 'colors', 'commander', 'lodash', 'readdir',
  				'semver', 'expect.js', 'mocha']);
			Object.keys(result.status).forEach(function (dependency) {
				expect(result.status[dependency].ok || (dependency + '.ok')).to.be(true);
			});
			done();
		});
	});
});
