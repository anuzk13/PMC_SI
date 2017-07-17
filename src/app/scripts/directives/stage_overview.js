'use strict';

/**
 * @ngdoc directive
 * @name pmcDataCollectorApp.directive:stageOverview
 * @description
 * # stageOverview
 */
angular.module('pmcDataCollectorApp')
.directive('stageOverview', ['$mdDialog', '$mdMedia' , 'patientService', 'systemConfigService', 'patientGrowthService', function ($mdDialog, $mdMedia,patientService, systemConfigService, patientGrowthService) {
  return {
    scope: {
      stage: '=info'
    },
    templateUrl: 'views/stage_overview.html',
    link: function update($scope, element, attrs) {

      systemConfigService.getPatientStages().then( function (stages) {
        var stagekey = $scope.stage.type.replace("STAGE_","");
        $scope.title = stages.Stages[stagekey].nameKey;
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

      loadPatientGrowth().then( function (results) {
        $scope.correctGrowthStyle = $scope.stage.HasCorrectGrowth ? '' : 'md-warn';
        $scope.correctGrowthBorder = $scope.stage.HasCorrectGrowth ? 'statusList md-whiteframe-z2 frame-taller' : 'statusList-warn md-whiteframe-z2 frame-taller';
        $scope.growthVars = results;
      });


      $scope.editStage = function() {
        var customFullscreen = $mdMedia('xs') || $mdMedia('sm');
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

        $mdDialog.show({
          controller: "StageEditDialogCtrl",
          templateUrl: 'views/stage_edit_dialog.html',
          parent: angular.element(document.body),
          clickOutsideToClose:true,
          fullscreen: useFullScreen,
          locals : {dialogStage : $scope.stage}
        })
        .then(function(stageData) {

          loadPatientGrowth().then( function (results) {
            $scope.correctGrowthStyle = $scope.stage.HasCorrectGrowth ? '' : 'md-warn';
            $scope.correctGrowthBorder = $scope.stage.HasCorrectGrowth ? 'statusList md-whiteframe-z2 frame-taller' : 'statusList-warn md-whiteframe-z2 frame-taller';
            $scope.growthVars = results;
            $scope.$apply();
          });


        }, function() {
        });
      };

      function loadPatientGrowth () {
        var variables = [];
        return Promise.all([patientService.getPatient($scope.stage.Patient_id), systemConfigService.getGrowthChartMeta()]).then( function (values) {
          var patient = values[0];
          var growthMeta = patient.Sex ? values[1].Charts[patient.Sex] : values[1].Charts['SX01'];
          var growthPromises = [];
          for (var i = 0; i < growthMeta.length; i++) {
            var meta = growthMeta[i];
            var chart = meta.file;
            var patientVariable = meta.var;
            var nameKey = meta.nameKey;
            var icon = meta.icon;
            var patientValue = $scope.stage[patientVariable];
            var patientCorrectedBirth =  moment(patient.CorrectedBirthDate, "DD/MM/YYYY");
            var dateStageReached = moment($scope.stage.DateStageReached, "DD/MM/YYYY");
            var monthsPassed= dateStageReached.diff(patientCorrectedBirth, 'month');
            if (patientValue) {
              growthPromises.push(patientGrowthService.calculatePatientGrowth(chart, patientValue, monthsPassed));
              growthPromises.push(patientGrowthService.getAverageValue(chart, monthsPassed));
              variables.push( {nameKey:nameKey, value:patientValue, icon:icon});
            }
          };
          return Promise.all(growthPromises);
        }).then( function (growthResults){
            for (var i = 0; i < variables.length; i++) {
              var growthResult = growthResults[i*2];
              var meanValue = growthResults[i*2+1];
              variables[i].growthResult = growthResult;
              if (!growthResult) {
                variables[i].style = "color:rgb(255,152,0);width:50px;height:50px;"
              } else {
                variables[i].style = "color:rgb(0,150,136);width:50px;height:50px;"
              }
              variables[i].meanValue = meanValue;
            };
            return variables;
        });
      };

    }
  };
}]);
