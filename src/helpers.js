var _ = require('lodash');
var path = require('path');
var s = require('./string');


module.exports = {
    extractLiteral: function (methodName, node) {
        var line = node.loc.start.line;

        if (node.type === 'Literal') {
            return node.value;
        }
    },

    extractDependency: function (methodName, node) {
        var self = this;
        var line = node.loc.start.line;

        if (node.type === 'ArrayExpression') {
            var elements = node.elements;
            return _.transform(elements, function (result, element, index) {
                if (element.type === 'Literal') {
                    result.push(element.value);

                } else if (element.type === 'FunctionExpression') {
                    _.each(self.extractDependency(methodName, element), function (name) {
                        if (!name.startsWith('$')) {
                            result.push(name);
                        }
                    });
                }
            });

        } else if (node.type === 'FunctionExpression') {
            // Extract arguments
            return _.transform(node.params, function (result, param) {
                if (!param.name.startsWith('$')) {
                    result.push(param.name);
                }
            });
        }

        // Ignore all others
    },

    absolutePathToRelative: function (pathBase, absolutePath) {
        var relativePath = path.relative(pathBase, absolutePath);

        if (!relativePath.startsWith(path.sep) || !relativePath.startsWith('..')) {
            relativePath = './' + relativePath;
        }

        return relativePath;
    },

    isString: function (obj) {
        return Object.prototype.toString.call(obj) === '[object String]';
    },

    isRegexp: function (obj) {
        return Object.prototype.toString.call(obj) === '[object RegExp]';
    }
};
