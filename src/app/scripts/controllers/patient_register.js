'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:PatientRegisterCtrl
 * @description
 * # PatientRegisterCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('PatientRegisterCtrl', ['$scope','$location', '$translate', '$mdDialog', '$mdMedia', 'patientService', 'systemConfigService', function ($scope, $location, $translate, $mdDialog, $mdMedia, patientService, systemConfigService) {

    var getSexTypes = systemConfigService.getSexTypes();
    var getDocTypes = systemConfigService.getDocTypes();
    var getPatIDTypes = systemConfigService.getPatientIDTypes();

    $scope.forms = {};

    $scope.title = "Patientregister.Title";
    Promise.all([getSexTypes, getDocTypes,getPatIDTypes]).then(function(values) {
      $scope.sexTypes = values[0];
      $scope.docTypes = values[1];
      $scope.patRegTypes = values[2];
    }).catch(function (error) {
      console.log(error);
    });

    var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

    function showAlert ( error ) {
      $mdDialog.show({
        controller: "AlertDialogCtrl",
        templateUrl: 'views/alert_dialog.html',
        parent: angular.element(document.body),
        clickOutsideToClose:true,
        fullscreen: useFullScreen,
        locals : {labels :
                   {title : 'Patientregister.Dialog.Title',
                    content: 'Patientregister.Dialog.' + error,
                    acceptText: 'Patientregister.Dialog.Accept'} }
      })
      .then(function(accept) {
        //Ok
      }, function() {
        //Dialog cancelled
      });
    };

    $scope.gestationalAgeBounds = {
      min: 0,
      max: 40,
      units:""
    };

    $scope.weightBounds = {
      min: 500,
      max: 14000,
      units:"gr."
    };

    $scope.parentAgeBounds = {
      min: 0,
      max: 100,
      units:""
    };

    $scope.patient = {};
    $scope.BirthDate = null;
    $scope.responsable = {};
    $scope.registerConfirm = "";

    $scope.savePatient = function () {

      $scope.patient.BirthDate = $scope.BirthDate ?  parseDate ($scope.BirthDate) : null;
      patientService.createPatient($scope.patient, $scope.responsable).then(function (res) {
        console.log(res)
        if (res.error) {
            showAlert(res.error);
        } else if (res.patientID){
          clearForm();
          $location.path( "/patient_detail/"+res.patientID+"/0");
        }
      });

    };

    function clearForm () {
      $scope.forms.form1.$setPristine();
      $scope.forms.form1.$setValidity();
      $scope.forms.form1.$setUntouched();
      $scope.patient = {};
      $scope.BirthDate = null;
      $scope.responsable = {};
      $scope.registerConfirm = "";
    }

    function parseDate (date) {
      return moment(date).format('DD/MM/YYYY');
    }



  }]);
