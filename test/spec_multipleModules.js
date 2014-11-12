var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    multipleA:'./fixtures/multipleModules/a.js',
    multipleB:'./fixtures/multipleModules/b.js',
    multipleC:'./fixtures/multipleModules/c.js'
};

var folders = {
    folderA: './fixtures/multipleModules',
    multiple: './fixtures/multipleModules/**/*.js'
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

    it('should extract injected dependency names', function () {
        ngRequire.update(folders.multiple);

        expect(ngRequire.getMeta(fixtures.multipleA).injectedProviders).to.have.members(['c']);
        expect(ngRequire.getMeta(fixtures.multipleB).injectedProviders).to.have.members(['a', 'c']);
        expect(ngRequire.getMeta(fixtures.multipleC).injectedProviders).to.have.members(['a', 'b']);
    });

    it('should get missing path', function () {
        ngRequire.update(folders.multiple);

        // Module a has DI of c only but in it's dependency it requires module b
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.multipleA), 'moduleName')).to.have.members(['b', 'c']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.multipleB), 'moduleName')).to.have.members(['c', 'a']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.multipleC), 'moduleName')).to.have.members(['a', 'b']);
    });
});