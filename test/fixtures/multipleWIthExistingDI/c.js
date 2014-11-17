require('./a');

module.export = angular.module('c', ['a'])
.factory('c', function(a, b) {

});