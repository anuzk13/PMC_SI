'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:AlertDialogCtrl
 * @description
 * # AlertDialogCtrl
 * Controller of the pmcDataCollectorApp
 */

angular.module('pmcDataCollectorApp')
  .controller('AlertDialogCtrl', [ '$scope', '$mdDialog', 'labels', function ($scope, $mdDialog, labels) {

  if (labels) {
    $scope.title = labels.title;
    $scope.content = labels.content;
    $scope.acceptText = labels.acceptText;
    $scope.cancelText = labels.cancelText;
  }

  $scope.hide = function() {
    $mdDialog.hide();
  };

  $scope.close = function() {
    $mdDialog.cancel();
  };

  $scope.confirm = function(answer) {
    $mdDialog.hide('OK');
  };

}]);
