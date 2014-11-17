var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    simpleA:'./fixtures/simpleWithExistingRequire/a.js',
    simpleB:'./fixtures/simpleWithExistingRequire/b.js',
    simpleC:'./fixtures/simpleWithExistingRequire/c.js',
    simpleD:'./fixtures/simpleWithExistingRequire/d.js',
    simpleE:'./fixtures/simpleWithExistingRequire/e.js'
};

var folders = {
    folderA: './fixtures/simpleWithExistingRequire',
    simple: './fixtures/simpleWithExistingRequire/**/*.js'
};

describe('Simple test case with existing require statement', function () {
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

    it('should extract injected dependency names', function () {
        ngRequire.update(folders.simple);

        expect(ngRequire.getMeta(fixtures.simpleA).injectedProviders).to.have.members(['b', 'c']);
        expect(ngRequire.getMeta(fixtures.simpleB).injectedProviders).to.have.members(['a', 'c']);
        expect(ngRequire.getMeta(fixtures.simpleC).injectedProviders).to.have.members(['a', 'b']);
    });

    it('should get missing path', function () {
        ngRequire.update(folders.simple);

        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleA), 'providerName')).to.have.members(['b']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleB), 'providerName')).to.have.members(['c']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleC), 'providerName')).to.have.members(['a']);
    });

    it('should attempt to parse files outside the include scope', function () {
        ngRequire.update([
            folders.simple,
            '!' + fixtures.simpleE
        ]);

        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.simpleD), 'providerName')).to.have.members(['a', 'b', 'c']);
    });
});