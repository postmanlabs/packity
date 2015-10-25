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
		        "version": "0.0.0",
		        "dependencies": {
		            "async": "^1.4.2",
		            "readdir": "^0.0.13",
		            "lodash": "^3.10.1",
		            "semver": "^5.0.3"
		        },
		        "devDependencies": {
		            "expect.js": "^0.3.1",
		            "mocha": "^2.3.3"
		        }
		    });
			done();
		});
	});

	it('must result having status', function (done) {
		require('../index')({ path: './' }, function (err, result) {
			expect(result.status).to.be.eql({
		        "async": { "ok": true, "message": "match" },
		        "readdir": { "ok": true, "message": "match" },
		        "lodash": { "ok": true, "message": "match" },
		        "semver": { "ok": true, "message": "match" }
		    });
			done();
		});
	});
});