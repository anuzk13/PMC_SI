'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:HospitalRegisterCtrl
 * @description
 * # HospitalRegisterCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('PmcUnitRegisterCtrl', ['$scope','$location','pmcUnitService','systemConfigService','remoteService', function ($scope,$location,pmcUnitService, systemConfigService,remoteService) {

    //User Input Models
    //PMC Unit data
    $scope.pmcUnit = {
      Name:'',
      Address:'',
      ParentAccess: null
    }
    //The user has access to a remote database
    $scope.remoteExists =  false;
    //Remote access options
    $scope.remoteOptions = [
     { label: 'PMCUnitRegister.RemoteRegister.Access', value: true },
     { label: 'PMCUnitRegister.RemoteRegister.NoAccess', value: false }
   ];
    //The remote database data
    $scope.remote = {
      Url:'',
      Username:'',
      Pasword:''
    }

    //Stages to be used as deafult in the program
    $scope.defaultStages = [];

    //Init default stages in select
    var stagesBackUp = [];
    $scope.stages = [];
    Promise.all([systemConfigService.getCollectorSettings(),systemConfigService.getPatientStages()]).then(function(stagesResults){
        setupScopeStages (stagesResults[0], stagesResults[1]);
      }).catch(function (err){
        console.log(err);
    });

    //Parent´s hour access bounds for input restrictions
    $scope.hourAccessBounds = {
      min: 0,
      max: 24,
      units:"h"
    };


    $scope.authProgress = false;
    $scope.showDataForm = false;

      //Error messages
    $scope.authError = null;
    $scope.closeAuthError= function () {
      $scope.authError = null;
    }

    //Success messages
    $scope.authSuccess = null;
    $scope.closeAuthSuccess = function () {
      $scope.authSuccess = null;
    }

    $scope.forms = {};

    $scope.backToCheck = function () {
      $scope.showDataForm = false;
    }

    //Registers the PMC and the configuration data
    $scope.registerPMC = function () {
      if ($scope.remoteExists) {
        if ($scope.loginSuccessful) {
          remoteService.setKeepOffline(false);
          remoteService.setRemoteDatabase($scope.remote.Url);
          remoteService.syncRemote();
        }
      } else {
        //User validated but canceled remote
        if ($scope.authSuccess) {
          remoteService.logoutRemote().then( function (result) {
            console.log(result)
          }).catch( function(err) {
            console.log(err);
          })
          $scope.remote = null;
        }
        remoteService.setKeepOffline(true);
      }
      var stages = cleanObject($scope.defaultStages).length ? cleanObject($scope.defaultStages) :stagesBackUp;
      console.log(stages);
      pmcUnitService.registerPMCUnit ($scope.pmcUnit ).then( function (result) {
        return systemConfigService.updateDataCollectorSettings(stages);
      }).then(function (result){
        if (result.ok) {
          $location.path( "/" );
        } else {
          console.log(result);
        }
      }).catch(function (err){
        console.log(err);
      })
    }

    //Validates the remote
    $scope.checkRemote = function () {
      if (!$scope.remoteExists) {
        $scope.showDataForm = true;
      } else {
        $scope.loginSuccessful = false;
        $scope.authProgress = true;
        $scope.authSuccess = null;
        $scope.authError = null;
        remoteService.authRemote($scope.remote.Username, $scope.remote.Pasword, $scope.remote.Url).then (function (result) {
          $scope.authProgress = false;
          if (result.error) {
            $scope.authError = {};
            if (result.name === "unauthorized" ) {
              $scope.authError.title = "Warnings.IncorrectUser";
              $scope.authError.message = "Suggestions.IncorrectUser";
            } else if (result.name = "not_found"){
              $scope.authError.title = "Warnings.NotFound";
              $scope.authError.message = "Suggestions.NotFound";
            } else if (result.name = "authentication_error") {
              $scope.authError.title = "Warnings.WrongProtocol";
              $scope.authError.message = "Suggestions.WrongProtocol";
            } else if (result.name = "unknown_error") {
              $scope.authError.title = "Warnings.NetworkError";
              $scope.authError.message = "Suggestions.NetworkError";
            }
          }
          else if ( result.ok === true ) {
            $scope.showDataForm = true;
            $scope.loginSuccessful = true;
            $scope.authSuccess = {};
            $scope.authSuccess.title = "PMCUnitRegister.RemoteRegister.SuccessTitle";
            Promise.all([pmcUnitService.getRemotePMCUnitdata(),
                        remoteService.getRemoteConfiguration()]).then(function (results) {
              var patientData = results[0];
              var remoteConfig = results[1];
              if (patientData) {
                $scope.pmcUnit = patientData;
                $scope.authSuccess.message = "PMCUnitRegister.RemoteRegister.PMCDataFound";
              } else {
                  console.log("here");
                $scope.authSuccess.message = "PMCUnitRegister.RemoteRegister.PMCDataNotFound";
              }
              if (remoteConfig) {
                $scope.defaultStages = remoteConfig.DefaultStages;
              }
              setTimeout(function () {$scope.$apply()}, 1000);
            }).catch( function (err) {
              console.log(err);
            })
          }
        })
      }
    }

    //Helpers

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
      stagesBackUp = angular.copy(systemSettings.DefaultStages);
    }

  }]);
