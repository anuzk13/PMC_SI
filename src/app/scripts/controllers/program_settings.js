'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:ProgramSettingsCtrl
 * @description
 * # ProgramSettingsCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('ProgramSettingsCtrl', [ '$scope' , '$mdDialog', '$mdMedia', 'remoteService', 'systemConfigService', function ( $scope, $mdDialog, $mdMedia,remoteService,systemConfigService) {



    systemConfigService.getSavedCustomColumns().then(function (customCols) {
      if (customCols.UsedCols.length == 0)
      {
        systemConfigService.getImportColumns().then(function (allCols){
          $scope.unusedCols = [];
          allCols.forEach( function (colType) {
            $scope.unusedCols = $scope.unusedCols.concat(colType.columns)
          })
          $scope.usedCols = [];
        })
      } else {
          $scope.unusedCols = customCols.UnusedCols;
          $scope.usedCols = customCols.UsedCols;
      }

      $scope.sortableOptions = {
        placeholder: "custom-import-col",
        connectWith: ".apps-container"
      };
    })


    $scope.title = "ProgramSettings.Title";
    $scope.forms = {};
    $scope.keepOffline = remoteService.keepOffline();
    $scope.remote = {};
    $scope.remote.Url = remoteService.getRemoteDatabase() || '';

    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

    $scope.editDatabase = function () {
      $scope.databaseEditMode = true;
    }

    $scope.$watch('keepOffline', function(newValue, oldValue) {
      if (newValue) {
        $scope.remote.Url = '';
      } else {
        $scope.remote.Url = remoteService.getRemoteDatabase() || '';
      }
    });

    $scope.closeError = function () {
      $scope.authError = null;
    }

    $scope.closeSuccess = function () {
      $scope.authSuccess = null;
    }

    $scope.saveExportChanges = function () {
      systemConfigService.saveCustomColumns($scope.usedCols,$scope.unusedCols).then( function () {
        $scope.exportCustomSuccess = true;
      }).catch( function () {

      })
    }

    $scope.closeExportSuccess = function () {
      $scope.exportCustomSuccess = false;
    }

    $scope.saveChanges = function () {
      $scope.authSuccess = null;
      $scope.authError = null;
      if ( !$scope.keepOffline ) {
        remoteService.authRemote($scope.remote.Username, $scope.remote.Pasword, $scope.remote.Url).then (function (result) {
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
            $scope.authSuccess = {};
            $scope.databaseEditMode = false;
            $scope.authSuccess.title = "PMCUnitRegister.RemoteRegister.SuccessTitle";
            remoteService.setRemoteDatabase($scope.remote.Url);
            remoteService.syncRemote();
            remoteService.setKeepOffline(false);
          }
        }).catch( function (err) {
          console.log(err);
        })
      } else {
        $scope.databaseEditMode = false;
        remoteService.logoutRemote();
        remoteService.deleteRemoteDatabase();
        remoteService.setKeepOffline(true);
      }
    }

    $scope.deleteDatabase = function () {
      $mdDialog.show({
        controller: "AlertDialogCtrl",
        templateUrl: 'views/alert_dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: useFullScreen,
        locals : {labels :
                   {title : 'ProgramSettings.DataTab.Dialog.Title',
                    content: 'ProgramSettings.DataTab.Dialog.Content',
                    acceptText: 'ProgramSettings.DataTab.Dialog.Accept',
                    cancelText: 'ProgramSettings.DataTab.Dialog.Cancel'} }
      })
      .then(function(accept) {
        $scope.databaseEditMode = false;
        $scope.keepOffline =  true;
        $scope.remote = null;
        $scope.authSuccess = null;
        remoteService.logoutRemote();
        remoteService.deleteRemoteDatabase();
        remoteService.setKeepOffline(true);
      }, function() {
        //Dialog cancelled
      });
    }

    $scope.cancelChanges = function () {
      $scope.databaseEditMode = false;
      $scope.keepOffline = remoteService.keepOffline();
      $scope.remote = {};
      $scope.authError = null;
      $scope.authSuccess = null;
      $scope.remote.Url = remoteService.getRemoteDatabase();
    }
  }]);
