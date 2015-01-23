var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    multipleA:'./fixtures/multipleWithExistingDI/a.js',
    multipleB:'./fixtures/multipleWithExistingDI/b.js',
    multipleC:'./fixtures/multipleWithExistingDI/c.js'
};

var folders = {
    folderA: './fixtures/multipleWithExistingDI',
    multiple: './fixtures/multipleWithExistingDI/**/*.js'
};

describe('Multiple with existing DI test case', function () {
    before(function () {
        _.each(fixtures, function (value, key) {
            fixtures[key] = path.resolve(__dirname, value);
        });

        _.each(folders, function (value, key) {
            folders[key] = path.resolve(__dirname, value);
        });

        console.log(fs.readdirSync(path.resolve(__dirname, './fixtures')));
    });

    afterEach(function () {
        ngRequire.clean();
    });

    it('should extract injected dependency names', function () {
        ngRequire.update(folders.multiple);

        expect(ngRequire.getMeta(fixtures.multipleA).injectedProviders).to.have.members(['b', 'c']);
        expect(ngRequire.getMeta(fixtures.multipleB).injectedProviders).to.have.members(['a', 'c']);
        expect(ngRequire.getMeta(fixtures.multipleC).injectedProviders).to.have.members(['a', 'b']);
    });

    it('should get missing path', function () {
        ngRequire.update(folders.multiple);

        // A B is still considering missing all modules because there is no require statement in the files
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.multipleA), 'moduleName')).to.have.members(['b', 'c']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.multipleB), 'moduleName')).to.have.members(['c', 'a']);
        expect(_.pluck(ngRequire.getMissingDependencies(fixtures.multipleC), 'moduleName')).to.have.members(['b']);
    });
});