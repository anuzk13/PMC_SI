'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:MainDashboardCtrl
 * @description
 * # MainDashboardCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('MainDashboardCtrl', ['$scope' ,'systemConfigService', 'patientService', function($scope, systemConfigService, patientService) {

  var stageslist = [];
  $scope.stages = [];
  var stagePromises = [];

  systemConfigService.stages.forEach(function (stage) {
    stagePromises.push(patientService.getStagePendientsUntilToday(stage.dataType));
  });
  $scope.topLoading =  true;
  Promise.all(stagePromises).then(function (values) {
    $scope.topLoading =  false;
    var stageCount = 0;
    values.forEach (function (result) {
      var resultStage = {
        nameKey:systemConfigService.stages[stageCount].nameKey,
        patients:result.rows,
        type:systemConfigService.stages[stageCount].dataType
      }
      stageCount = stageCount+1;
      stageslist.push(resultStage);
    });
    $scope.stages = listToMatrix(stageslist, 2);
    $scope.$apply();
  }).catch(function(err){
    console.log(err);
  });


   function listToMatrix(list, elementsPerSubArray) {
    var matrix = [], i, k;

    for (i = 0, k = -1; i < list.length; i++) {
      if (i % elementsPerSubArray === 0) {
        k++;
        matrix[k] = [];
      }
      matrix[k].push(list[i]);
    }
    return matrix;
  };

}]);
