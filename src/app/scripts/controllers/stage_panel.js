'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:StagePanelCtrl
 * @description
 * # StagePanelCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('StagePanelCtrl', [ '$scope',  function ($scope) {
    $scope.stagepaneltemplate = {
      name:"stage panel template",
      url:"views/stage_panel.html"
    };
  }]);
