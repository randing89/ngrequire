var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    a1:'./fixtures/multipleProvidersInSameModule/a1.js',
    a2:'./fixtures/multipleProvidersInSameModule/a2.js',
    a3:'./fixtures/multipleProvidersInSameModule/a3.js',
    b:'./fixtures/multipleProvidersInSameModule/b.js'
};

var folders = {
    folderA: './fixtures/multipleProvidersInSameModule',
    multiple: './fixtures/multipleProvidersInSameModule/**/*.js'
};

describe('Multiple module test case', function () {
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

    it('should extract provider name', function () {
        ngRequire.update(folders.multiple);

        expect(ngRequire.getMeta(fixtures.a1).namedProviders).to.have.members(['a1']);
        expect(ngRequire.getMeta(fixtures.a2).namedProviders).to.have.members(['a2']);
    });
});