var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    simpleA:'./fixtures/simple/a.js',
    simpleB:'./fixtures/simple/b.js',
    simpleC:'./fixtures/simple/c.js'
};

var folders = {
    folderA: './fixtures/simple',
    simple: './fixtures/simple/**/*.js'
};

describe('Simple test case', function () {
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

    it('should expand folder', function () {
        var result = ngRequire.update(folders.folderA);

        expect(result.success).to.have.length(3);
    });

    it('should skip if not modified', function () {
        // Should skip the file since it's not modified
        var fixtureFiles = _.values(fixtures);

        ngRequire._update(fixtureFiles);
        var result = ngRequire._update(fixtureFiles);

        expect(result.skipped).to.have.length(fixtureFiles.length);
    });

    it('should extract injected dependency names', function () {
        ngRequire.update(folders.simple);

        expect(ngRequire.getMeta(fixtures.simpleA).injectedProviders).to.have.members(['b', 'c']);
        expect(ngRequire.getMeta(fixtures.simpleB).injectedProviders).to.have.members(['a', 'c']);
        expect(ngRequire.getMeta(fixtures.simpleC).injectedProviders).to.have.members(['a', 'b']);
    });

    it('should get missing path', function () {
        ngRequire.update(folders.simple);

        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleA), 'providerName')).to.have.members(['b', 'c']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleB), 'providerName')).to.have.members(['a', 'c']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleC), 'providerName')).to.have.members(['a', 'b']);
    });
});