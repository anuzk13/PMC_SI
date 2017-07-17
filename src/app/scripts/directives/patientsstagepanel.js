'use strict';

/**
 * @ngdoc directive
 * @name pmcDataCollectorApp.directive:patientsStagePanel
 * @description
 * # patientsStagePanel
 */
angular.module('pmcDataCollectorApp')
  .directive('patientStage', ['$mdDialog', '$mdMedia' , 'patientService', 'systemConfigService', 'patientGrowthService', function ($mdDialog, $mdMedia,patientService, systemConfigService, patientGrowthService) {
    return {
      scope: {
        stageData: '=info'
      },
      templateUrl: 'views/stage_panel.html',
      link: function update($scope, element, attrs) {
        $scope.patientStage = {};
        $scope.stageTpe = $scope.stageData.type;

        $scope.updatePatient = function (idPatient) {

          var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
          var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

          $scope.patientID = $scope.stageData.patients[idPatient].value.patientId;

          patientService.getPatientStage($scope.stageTpe, $scope.patientID).then(function (patientStage) {

            $scope.patientStage = patientStage;
            $mdDialog.show({
              controller: "StageEditDialogCtrl",
              templateUrl: 'views/stage_edit_dialog.html',
              parent: angular.element(document.body),
              clickOutsideToClose:true,
              fullscreen: useFullScreen,
              locals : {dialogStage : patientStage}
            })
            .then(function(stageData) {
              if (stageData.Complete) {
                $scope.stageData.patients.splice(idPatient, 1);
                var nextId = idPatient;
                if ($scope.stageData.patients.length > nextId ){
                  $scope.updatePatient(nextId);
                } else {
                  patientService.getStagePendientsUntilToday($scope.stageTpe).then( function (result) {
                    $scope.stageData.patients = $scope.stageData.patients.concat(result.rows);
                    $scope.updatePatient(nextId);
                    console.log($scope.stageData.patients, nextId)
                  })
                }
              }
            }, function() {

            });

          }).catch (function (error) {
            console.log(error);
          });

          $scope.$watch(function() {
            return $mdMedia('xs') || $mdMedia('sm');
          }, function(wantsFullScreen) {
            $scope.customFullscreen = (wantsFullScreen === true);
          });
        }
      }
    };
  }]);
