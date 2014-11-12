var falafel = require('falafel');
var _ = require('lodash');

var helpers = require('./helpers');
var s = require('./string');

var ngFuncs = [
    'config',
    'run',
    'directive'
];

var ngProviders = [
    'controller',
    'provider',
    'factory',
    'service',
    'value',
    'constant',
    'decorator',
    'filter',
    'animation'
];

module.exports = {
    /**
     * Trace the callee chain until we reach the end
     *
     * @param node
     */
    traceCalleeChain: function (node) {
        var self = this;
        var context = node.object || node.callee;

        if (context) {
            return self.traceCalleeChain(context);
        }

        return node.name;
    },

    /**
     * Extract module name and dependencies form a file
     *
     * @param content File content
     * @param options
     *
     * @return mixin { name: 'module name', dependencies: [ 'dependency' ]  }
     */
    parse: function (content, options) {
        var self = this;

        options = options || {};

        var moduleName = undefined,
            loadedFiles = [],
            injectedProviders = [],
            namedProviders = [],
            providerTypes = [],
            dependencies = [];

        falafel(content, { loc: true }, function (node) {
            var nameNode, definitionNode;

            if (node.type === 'CallExpression' && node.callee && node.arguments) {
                var methodName = (node.callee.property || {}).name || node.callee.name;
                var line = node.loc.start.line;

                if (methodName === 'require') {
                    loadedFiles = _.union(loadedFiles, [ helpers.extractLiteral(methodName, node.arguments[0]) ]);

                } else {
                    // Check if the callee object is angular
                    if (self.traceCalleeChain(node) !== 'angular') {
                        return;
                    }

                    var arguments = node.arguments;
                    nameNode = arguments[0];
                    definitionNode = arguments[arguments.length - 1];

                    if (methodName === 'module') {
                        if (nameNode.type !== 'Literal') {
                            // Skip this statement if it's not literal

                            return;
                        }

                        var name = helpers.extractLiteral(methodName, nameNode);

                        // If we are processing module
                        if (moduleName && moduleName !== name) {
                            throw new Error('Please do not define multiple modules in same file on line {0}'.f(line));
                        }
                        moduleName = name;

                        if (arguments.length > 1) {
                            dependencies = _.union(dependencies, helpers.extractDependency(methodName, definitionNode));
                        }
                    } else {
                        var isNgProvider = ngProviders.indexOf(methodName) !== -1;
                        var isNgFunction = ngFuncs.indexOf(methodName) !== -1;

                        if (isNgProvider || isNgFunction) {
                            if (isNgProvider) {
                                // If we are processing other named providers
                                namedProviders.push(helpers.extractLiteral(methodName, arguments[0]));
                            }

                            if ((isNgProvider && arguments.length > 1) || isNgFunction) {
                                injectedProviders = _.union(injectedProviders, helpers.extractDependency(methodName, definitionNode));
                            }

                            providerTypes.push(methodName);
                        }
                    }
                }
            }
        });

        if (!s.nullOrEmpty(moduleName)) {
            return {
                moduleName: moduleName,
                loadedFiles: loadedFiles,
                injectedProviders: injectedProviders,
                dependencies: dependencies,
                namedProviders: namedProviders,
                providerTypes: providerTypes
            };
        }
    }
};
