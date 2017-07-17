'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:StageEditDialogCtrl
 * @description
 * # StageEditDialogCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('StageEditDialogCtrl',  ['$scope', '$mdDialog', 'systemConfigService', 'patientService', 'patientGrowthService', 'dialogStage', function ($scope, $mdDialog, systemConfigService, patientService, patientGrowthService, dialogStage) {

    $scope.dialogStage = dialogStage;

    patientService.getPatient($scope.dialogStage.Patient_id).then( function (patientObject) {
      $scope.stagePatient = patientObject;
    })

    var getVaccineTypes =  systemConfigService.getVaccineTypes();
    var getExamTypes = systemConfigService.getExamTypes();
    var getSupplyTypes= systemConfigService.getFoodSupplyTypes();

    Promise.all([getVaccineTypes, getExamTypes, getSupplyTypes]).then(function(values) {

      $scope.vaccineTypes = values[0];
      $scope.examTypes = values[1];
      $scope.foodSupplyTypes = values[2];
    }).catch(function (error) {
      console.log(error);
    });

    $scope.weightBounds = {
      min: 500,
      max: 14000,
      units:"gr."
    };

    $scope.sizeBounds = {
      min: 0,
      max: 125,
      units:"cm."
    };

    $scope.headBounds = {
      min: 0,
      max: 60,
      units:"cm."
    };

    $scope.vaccines = [];
    angular.forEach($scope.dialogStage.StageVaccines, function(value, key) {
      this.push(key);
    }, $scope.vaccines);


    $scope.exams = [];
    angular.forEach($scope.dialogStage.StageExamns, function(value, key) {
      this.push(key);
    }, $scope.exams);
    $scope.saving = false;

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.save = function() {
      delete $scope.dialogStage.$$hashKey;
      saveExamsVaccines ();
      $scope.saving = true;
      savePatientGrowth().then (function (result) {

        return;
      }).then (function () {
        patientService.updatePatientStage( $scope.dialogStage, $scope.dialogStage.Patient_id).then(
          function (response) {

          }).catch(function (error) {
            console.log(error);
          });
        $scope.saving = false;
        $mdDialog.hide($scope.dialogStage);
      });
    };

    $scope.saveAndComplete = function () {
      delete $scope.dialogStage.$$hashKey;
      saveExamsVaccines ();
      $scope.dialogStage.Complete = true;
      savePatientGrowth().then (function (result) {

        return;
      }).then (function () {
        patientService.updatePatientStage($scope.dialogStage, $scope.dialogStage.Patient_id).then(
          function (response) {

          }).catch(function (error) {
            console.log(error);
          });
        $mdDialog.hide($scope.dialogStage);
      });
    };

    function saveExamsVaccines () {
      $scope.dialogStage.StageVaccines = {};
      $scope.dialogStage.StageExamns = {};
      $scope.vaccines.forEach( function (vaccine) {
        $scope.dialogStage.StageVaccines[vaccine] = true;
      });
      $scope.exams.forEach(function (exam){
        $scope.dialogStage.StageExamns[exam] = true;
      });
    };

    function savePatientGrowth () {
      if (!$scope.stagePatient.Sex) {
        return Promise.resolve(null);
      }
      return systemConfigService.getGrowthChartMeta().then( function (chartMeta) {
        var growthMeta = chartMeta.Charts[$scope.stagePatient.Sex] ;
        var growthPromises = [];
        for (var i = 0; i < growthMeta.length; i++) {
          var meta = growthMeta[i];
          var chart = meta.file;
          var patientVariable = meta.var;
          var patientValue = $scope.dialogStage[patientVariable];
          var patientCorrectedBirth =  moment($scope.stagePatient.CorrectedBirthDate, "DD/MM/YYYY");
          var dateStageReached = moment($scope.dialogStage.DateStageReached, "DD/MM/YYYY");
          var monthsPassed= dateStageReached.diff(patientCorrectedBirth, 'month');
          if (patientValue) {
            growthPromises.push(patientGrowthService.calculatePatientGrowth(chart, patientValue, monthsPassed));
          } else {
            return;
          }
        }
        return Promise.all(growthPromises);
      }).then( function (growthResults){
        if (growthResults) {
          var countByCorrectGrowth = true;
          for (var i = 0; i < growthResults.length; i++) {
            var patientHadCorrectGrowth = growthResults[i];
            if (!patientHadCorrectGrowth) {
              countByCorrectGrowth = false;
            }
          };
          $scope.dialogStage.HasCorrectGrowth = countByCorrectGrowth;
          return countByCorrectGrowth;
        } else {
          return;
        }
      });
    };

  }]);
