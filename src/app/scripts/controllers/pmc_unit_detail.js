'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:PmcDetailCtrl
 * @description
 * # PmcDetailCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('PmcUnitDetailCtrl', ['$scope' , 'pmcUnitService', 'systemConfigService', function ($scope, pmcUnitService, systemConfigService) {

    $scope.title = "PMCUnitDetail.Title";
    //If edit mode is diabled
    $scope.disabled= true;
    $scope.forms = {};
    $scope.pmcUnit = {
      Name:'',
      Address:'',
      ParentAccess: null
    }

    //Parent´s hour access bounds for input restrictions
    $scope.hourAccessBounds = {
      min: 0,
      max: 24,
      units:"h"
    };

    //Stages to be used as deafult in the program
    $scope.defaultStages = [];

    //Init default stages in select
    $scope.stagesBackUp = [];
    $scope.stages = [];
    Promise.all([systemConfigService.getCollectorSettings(),systemConfigService.getPatientStages()]).then(function(stagesResults){
        setupScopeStages (stagesResults[0], stagesResults[1]);
      }).catch(function (err){
        console.log(err);
    });

    pmcUnitService.getPMCUnit().then( function (pmcUnit) {
      if (pmcUnit) {
        $scope.pmcUnit = pmcUnit;
      }
    }).catch( function (err) {
      console.log(err);
    })

    $scope.enterEditMode = function () {
      $scope.disabled= false;
      $scope.pmcUnitBackup = angular.copy($scope.pmcUnit);

    }

    $scope.save = function () {
      $scope.disabled= true;
      $scope.pmcUnitBackup = angular.copy($scope.pmcUnit);
      $scope.stagesBackUp = angular.copy($scope.defaultStages);
      var stages = cleanObject($scope.defaultStages).length ? cleanObject($scope.defaultStages) : $scope.stagesBackUp;
      pmcUnitService.updatePMCUnit ($scope.pmcUnit ).then( function (result) {
        return systemConfigService.updateDataCollectorSettings(stages);
      }).then(function (result){
        if (result.ok) {
          //Ok
        } else {
          console.log(result);
        }
      }).catch(function (err){
        console.log(err);
      })
    }

    $scope.cancelEdit = function () {
      $scope.disabled= true;
      $scope.pmcUnit = angular.copy($scope.pmcUnitBackup);
      $scope.defaultStages = angular.copy($scope.stagesBackUp);
    }

    //Removes $$hashkey attribute added by angular
    function cleanObject (object) {
      return JSON.parse(angular.toJson( object ));
    }

    function setupScopeStages (systemSettings, systemStages) {
      for (var key in systemStages.Stages) {
        var stage = systemStages.Stages[key];
        var obj = {};
        obj.nameKey=stage.nameKey;
        obj.key = key;
        $scope.stages.push(obj);
      }
      $scope.defaultStages = systemSettings.DefaultStages;
      $scope.stagesBackUp = angular.copy(systemSettings.DefaultStages);
    }
  }]);
