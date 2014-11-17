require('./a');

module.export = angular.module('simpleWIthExistingRequire')
.factory('b', function(a, c) {

});