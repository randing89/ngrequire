var path = require('path');
var expect = require('chai').expect;
var _ = require('lodash');
var ngRequire = require('../index');

var fixtures = {
    simple: './fixtures/simple/a.js',
    valid: './fixtures/followPath/**/allValid.js',
    moduleNameNotValid: './fixtures/followPath/**/moduleNameNotValid.js',
    providerNameNotValid: './fixtures/followPath/**/providerNameNotValid.js',
    multipleProviders: './fixtures/followPath/**/multipleProviders.js'
};

describe('Options test', function () {
    before(function () {
        _.each(fixtures, function (value, key) {
            fixtures[key] = path.resolve(__dirname, value);
        });
    });

    afterEach(function () {
        ngRequire.clean();
    });

    it('should valid', function () {
        var result = ngRequire.update(fixtures.valid, {
            ensureModuleName: true,
            ensureProviderName: true
        });

        expect(result.success).to.have.length(1);
    });

    it('should report incorrect module name', function (done) {
        try {
            ngRequire.update(fixtures.moduleNameNotValid, {
                ensureModuleName: true
            });
        } catch (e) {
            expect(e.message).to.match(/should follow folder path/);
            done();
        }
    });

    it('should report incorrect provider name', function (done) {
        try {
            ngRequire.update(fixtures.providerNameNotValid, {
                ensureProviderName: true
            });
        } catch (e) {
            expect(e.message).to.match(/not matching file name/);
            done();
        }
    });

    it('should report multiple providers', function (done) {
        try {
            ngRequire.update(fixtures.multipleProviders, {
                ensureProviderName: true
            });
        } catch (e) {
            expect(e.message).to.match(/in different files/);
            done();
        }
    });

    it('should ignore', function (done) {
        try {
            ngRequire.update(fixtures.simple);
            ngRequire.getMissingDependencies(fixtures.simple);
        } catch (e) {
            // Should fail without ignore
            expect(e.message).to.match(/Can not find provider "b, c"/);

            ngRequire.clean();
            ngRequire.update(fixtures.simple, {
                ignoreProviders: [
                    'b',
                    /^c/
                ]
            });

            // Should be ok
            ngRequire.getMissingDependencies(fixtures.simple);

            done();
        }
    });
});