'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('LoginCtrl',['$scope','$location', '$mdDialog', '$mdMedia', 'pmcUnitService', 'remoteService', function ($scope, $location, $mdDialog ,$mdMedia, pmcUnitService, remoteService) {


    pmcUnitService.getPMCUnit().then (function (unit) {
      $scope.unitName= unit.Name;
    });

    $scope.user = {
      username:null,
      password:null
    };

    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

    function showAlert (content) {
      $mdDialog.show({
        controller: "AlertDialogCtrl",
        templateUrl: 'views/alert_dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: useFullScreen,
        locals : {labels : {title : 'Alerts.LoginFailed.Title',
                  content: content,
                  acceptText: 'Alerts.Accept'} }
      })
      .then(function(accept) {

      }, function() {
        //Dialog cancelled
      });
    };

    $scope.loginOffline = function () {
      remoteService.logoutRemote();
      remoteService.deleteRemoteDatabase();
      remoteService.setKeepOffline(true);
      $location.path( "/");
    }

    $scope.loginUser = function () {
      var databaseUrl = remoteService.getRemoteDatabase();
      remoteService.authRemote ($scope.user.username, $scope.user.password, databaseUrl).then ( function (result) {
        if (result.error) {
          $scope.authError = {};
          if (result.name === "unauthorized" ) {
            showAlert ("Warnings.IncorrectUser");
          } else if (result.name = "not_found"){
            showAlert ("Warnings.NotFound");
          } else if (result.name = "authentication_error") {
            showAlert ("Warnings.WrongProtocol");
          } else if (result.name = "unknown_error") {
            showAlert ("Warnings.NetworkError");
          }
        }
        else if ( result.ok === true ) {
          remoteService.syncRemote();
          remoteService.setKeepOffline(false);
          $location.path( "/");
        }
      }).catch (function (result) {

      })

    };

  }]);
