var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    nonAngularCodeA:'./fixtures/nonAngularCode/random.js'
};

var folders = {
    nonAngularCode: './fixtures/nonAngularCode/**/*.js'
};

describe('nonAngularCode test case', function () {
    before(function () {
        _.each(fixtures, function (value, key) {
            fixtures[key] = path.resolve(__dirname, value);
        });

        _.each(folders, function (value, key) {
            folders[key] = path.resolve(__dirname, value);
        });
    });

    afterEach(function () {
        ngRequire.clean();
    });

    it('should skip non angular code', function () {
        var result = ngRequire.update(folders.nonAngularCode);

        expect(result.success).to.have.length(0);
        expect(result.skipped).to.have.length(1);
    });
});