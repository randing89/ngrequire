var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var readdirr = require('readdir-recursive');
var globule = require('globule');

var helpers = require('./src/helpers');
var s = require('./src/string');
var parser = require('./src/parser');

// {File path -> meta} mapping
var meta = {};

// {Provider -> file} mapping for fast lookup
var providerCache = {};

// {Module name -> file} mapping for fast lookup
var moduleCache = {};

// Shared options
var options = {};

var illegalPathCharRegexp = /<>:\?\*/;
var externalModulesRegexp = /bower_components|node_modules/i;

module.exports = {
    _parse: function (file) {
        if (file in meta) {
            // Skip if not modified
            var stat = fs.lstatSync(file);
            if (+stat.mtime < meta[file].lastUpdated) {
                meta[file].lastUpdated = +new Date();

                return false;
            }
        }

        var content = fs.readFileSync(file).toString();

        try {
            var metaData = parser.parse(content, options);

            if (metaData === undefined) {
                // Not a angular module never check again
                meta[file] = { path: file, angular: false, lastUpdated: +new Date() };
            } else {
                // Add to registry
                meta[file] = _.extend({ path: file, angular: true, lastUpdated: +new Date() }, metaData);
            }

            return meta[file];

        } catch (e) {
            e.message = 'Error in parsing file {0}. {1}'.f(file, e.message);
            throw e;
        }
    },


    /**
     * Update the mapping: moduleName -> filePath
     *
     * @param files Array of file paths or file content
     */
    _update: function (files) {
        var self = this;
        var skipped = [], success = [];

        if (!Array.isArray(files)) {
            files = [ files ];
        }

        // Expand folders
        for (var i = files.length -1 ; i >= 0; i--) {
            var file = files[i];

            if (!fs.existsSync(file)) {
                throw new Error('Can not find file {0}'.f(file));
            }

            var stat = fs.lstatSync(file);
            if (stat.isDirectory()) {
                // Remove the folder
                files.splice(i, 1);

                // Push files
                files = files.concat(readdirr.fileSync(file));
            }
        }

        _.each(files, function (file) {
            // Parse the file
            var metaData = self._parse(file);
            if (metaData === false || !metaData.angular) {
                return skipped.push(file);
            }

            // Do not apply naming check on external modules
            if (!externalModulesRegexp.test(file)) {

                // Naming check
                if (options.ensureModuleName) {
                    var expectedModuleName = path.dirname(file).replace(/\//g, '.');

                    if (!s.nullOrEmpty(metaData.moduleName) && expectedModuleName.indexOf(metaData.moduleName) === -1) {
                        throw new Error('Module "{0}" should follow folder path for {1}'.f(metaData.moduleName, file));
                    }
                }

                if (options.ensureProviderName) {
                    if (metaData.namedProviders.length > 1) {
                        throw new Error('Please define named providers "{0}" in different files'.f(metaData.namedProviders.join(', ')));

                    } else if (metaData.namedProviders.length === 1 && !s.nullOrEmpty(metaData.namedProviders[0])) {
                        var baseName = path.basename(file, '.js');
                        var providerName = metaData.namedProviders[0].toLowerCase();

                        var expectedProviderNames = [];
                        // like example
                        expectedProviderNames.push(baseName.toLowerCase());

                        // like ExampleController
                        expectedProviderNames.push((baseName + metaData.providerTypes[0]).toLowerCase());

                        // also skip ones start with $
                        if (providerName[0] !== '$' && expectedProviderNames.indexOf(providerName) === -1) {
                            throw new Error('Provider "{0}" is not matching file name at {1}'.f(metaData.namedProviders[0], file));
                        }
                    }
                }
            }

            // Add to cache
            moduleCache[metaData.moduleName] = file;

            _.each(metaData.namedProviders, function (namedProvider) {
                providerCache[namedProvider] = file;
            });

            success.push(file);
        });

        return {
            success: success,
            skipped: skipped
        }
    },

    /**
     * Get META data from absolute file path
     * Please do a update before calling this to ensure latest status
     *
     * @param file
     * @returns Object
     */
    getMeta: function (file) {
        return s.nullOrEmpty(file) ? meta : meta[file];
    },

    /**
     * Get modules that not included
     *
     * @param file
     * @return {Object}
     */
    getMissingDependencies: function (file) {
        var self = this;

        if (!(file in meta)) {
            self._update(file);
        }

        var fileMeta = meta[file];
        var fileBase = path.dirname(file);
        var result = [], loadedModules = {}, loadedProviders = {};

        // Add loaded providers to the list
        _.map(fileMeta.loadedFiles, function (relativePath) {
            // Check if the path is actually path
            // Webpack may have many fancy stuff like require('bundle?a')
            if (illegalPathCharRegexp.test(relativePath) || !relativePath.startsWith('.')) {
                return;
            }

            var filePath = path.resolve(fileBase, relativePath);

            // Default to js
            if (s.nullOrEmpty(path.extname(filePath))) {
                filePath += '.js';
            }

            /*
             * To be a valid provider:
             * File path is in the registry and also in the dependency list
             * Or the file path is not in registry but the parse result indicates it's a angular module
             */
            var loadedFileMeta;

            /*
             * Best effort to parse required file
             */
            if (!(filePath in meta) && path.extname(filePath) === 'js' && fs.existsSync(filePath)) {
                // attempt to parse file
                self._parse(filePath);
            }

            loadedFileMeta = meta[filePath];
            if (loadedFileMeta) {
                var isDependency = fileMeta.dependencies.indexOf(loadedFileMeta.moduleName) !== -1;
                var isInSameModule = fileMeta.moduleName === loadedFileMeta.moduleName;

                // A provider can be regarded as loaded only if
                // - Being required (require('path'))
                // - Have dependency on angular.module('name', [ dependency here ])
                if (isInSameModule || isDependency) {
                    loadedProviders[loadedFileMeta.namedProviders] = true;
                }

                loadedModules[loadedFileMeta.moduleName] = true;
            }
        });

        // Find out what is missing
        var missingInjectedProviders = _.difference(fileMeta.injectedProviders, _.keys(loadedProviders));

        // Try to find them in the cache
        for (var i = missingInjectedProviders.length - 1; i >= 0; i--) {
            var provider = missingInjectedProviders[i];
            if (provider in providerCache) {
                missingInjectedProviders.splice(i, 1);

                // Absolute to relative path
                var absolutePath = providerCache[provider];
                var relativePath = helpers.absolutePathToRelative(fileBase, absolutePath);

                result.push({
                    providerName: provider,
                    moduleName: meta[providerCache[provider]].moduleName,
                    path: absolutePath,
                    relativePath: relativePath
                });
            }
        }

        // If still can't find
        if (missingInjectedProviders.length > 0) {
            throw new Error('Can not find providers "{0}" in {1}'.f(missingInjectedProviders.join(', '), file));
        }

        // Include modules that user explicit specified
        _.each(fileMeta.dependencies, function (dependency) {
            if (!(dependency in loadedModules)) {
                // Absolute to relative path
                var absolutePath = moduleCache[dependency];

                // Only process known modules
                if (absolutePath) {
                    var relativePath = helpers.absolutePathToRelative(fileBase, absolutePath);

                    result.push({
                        providerName: '',
                        moduleName:   dependency,
                        path:         absolutePath,
                        relativePath: relativePath
                    });
                }
            }
        });

        return result;
    },

    /**
     * Update the mapping: moduleName -> filePath
     *
     * @param patterns
     * @param updateOptions
     */
    update: function (patterns, updateOptions) {
        var self = this;
        var paths = globule.find(patterns);

        options = _.extend(options, updateOptions);

        return self._update(paths);
    },

    /**
     * Clean cache
     */
    clean: function () {
        meta = {};
        options = {};
        providerCache = {};
    }
};
