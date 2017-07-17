'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:PatientDetailCtrl
 * @description
 * # PatientDetailCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('PatientDetailCtrl',[ '$routeParams','$scope', 'patientService', 'systemConfigService',function ($routeParams, $scope, patientService, systemConfigService) {

    var getVaccineTypes =  systemConfigService.getVaccineTypes();
    var getExamTypes = systemConfigService.getExamTypes();
    var getSupplyTypes= systemConfigService.getFoodSupplyTypes();
    var getSexTypes = systemConfigService.getSexTypes();
    var getDocTypes = systemConfigService.getDocTypes();
    var getExitCriteria = systemConfigService.getExitCriteria();
    var getPatIDTypes = systemConfigService.getPatientIDTypes();
    var getDXtypes = systemConfigService.getDXTypes();

    $scope.forms = {};
    $scope.replacePatient = false;
    $scope.replaceStages= false;
    $scope.stagesChanged = false;

    $scope.gestationalAgeBounds = {
      min: 0,
      max: 40,
      units:""
    };

    $scope.changeID = function () {
      if (!$scope.replacePatient) {
        $scope.disabled= false;
        $scope.replacePatient= true;
      }
    }

    $scope.changeStages = function () {
      if (!$scope.replaceStages) {
        $scope.disabled= false;
        $scope.replaceStages= true;
      }
    }

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

    $scope.gestationalAgeBoundsC = {
      min: 0,
      max: 50,
      units:""
    };

    $scope.addAttention = function () {
      if ($scope.newAttention) {
        var attentionDate = moment($scope.newAttention).format('DD/MM/YYYY');
        patientService.registerPatientAttention($scope.patientId, attentionDate).then(function(resp){
          $scope.newAttention = null;
          $scope.patient.attentions = resp;
        }).catch(function(err){
          console.log(err);
        })
      }
    }

    $scope.addHospitalization = function () {
      if ($scope.newHospitalization) {
        var hospDate = moment($scope.newHospitalization).format('DD/MM/YYYY');
        patientService.registerPatientHospitalization($scope.patientId,hospDate).then(function(resp){
          $scope.newHospitalization = null;
          $scope.patient.hospitalizations= resp;
        }).catch(function(err){
          console.log(err);
        })
      }
    }

    $scope.removeAttention =  function (index) {
      patientService.removePatientAttention($scope.patientId,index).then(function(resp){
        $scope.patient.attentions= resp;
      }).catch(function(err){
        console.log(err);
      })
    }

    $scope.removeHospitalization = function (index) {
      patientService.removePatientHospitalization($scope.patientId,index).then(function(resp){
        $scope.patient.hospitalizations= resp;
      }).catch(function(err){
        console.log(err);
      });
    }

    $scope.patientData = {};
    $scope.reloadPatientData = function () {
      patientService.getPatientObject($scope.patientId).then(function (result) {
        $scope.patientData = result.PATIENT;
        $scope.patientObject = result;
      })
    }

    $scope.title = "PatientDetail.Title";
    Promise.all([getVaccineTypes, getExamTypes, getSupplyTypes, getSexTypes, getDocTypes, getExitCriteria, getPatIDTypes, getDXtypes]).then(function(values) {
      $scope.vaccineTypes = values[0];
      $scope.examTypes = values[1];
      $scope.foodSupplyTypes = values[2];
      $scope.sexTypes = values[3];
      $scope.docTypes = values[4];
      $scope.exitCriteria = values[5];
      $scope.patRegTypes = values[6];
      $scope.dxTypes = values[7];
    }).catch(function (error) {
      console.log(error);
    });

    $scope.patientId =  $routeParams.patient_id;
    $scope.tabNumber = $routeParams.tab || 0;

    $scope.patient = {
      SocialRegistry: "",
      Sex:"",
      GestationalAge:"",
      BirthDate: null
    };

    $scope.patientStages = [];

    patientService.getPatientObject($scope.patientId).then( function (result) {
      $scope.patient = result.PATIENT;
      $scope.patientObject = result;
      var stages = [];
      systemConfigService.stages.forEach(function (stage) {
        stages.push(result.STAGES[stage.dataType]);
      });
      $scope.patientStages = listToMatrix(stages, 2);
      $scope.responsable = result.RESPONSABLE;
      $scope.observation = result.OBSERVATION;
      $scope.patientBackup = angular.copy($scope.patient);
      $scope.resposableBackup = angular.copy($scope.responsable);
      $scope.observationBackup = angular.copy($scope.observation);
      $scope.BirthDate = new Date(moment($scope.patient.BirthDate, 'DD/MM/YYYY').toDate().toString());
    });

    $scope.enterEditMode = function () {
      if ($scope.disabled) {
        $scope.disabled= false;
      }
    };

    $scope.save = function (){
      $scope.patient.BirthDate = $scope.BirthDate ?  parseDate ($scope.BirthDate) : null;
      var firstPromise = $scope.replacePatient ? replaceCurrentPatient() : updatePatient();
      if ($scope.replaceStages) {
        $scope.replaceStages= false;
        firstPromise.then(function (result){
          return patientService.getPatientObject($scope.patientId);
        }).then( function (result) {
          result.PATIENT = $scope.patient;
          return result;
        }).then(function(patientObject) {
          return patientService.editPatientStages($scope.patientId, patientObject);
        }).then(function (res) {
          return replacePatientObject(res)
        });
      }
    };

    function replacePatientObject( patientObject) {
      var newPatientObject = patientObject;
      patientService.deletePatient($scope.patientId).then(function (){
        return patientService.savePatientImport (newPatientObject._id , newPatientObject.patientObject , true );
      }).then( function (result) {
        $scope.patientId = newPatientObject._id;
        $scope.patient = newPatientObject.patientObject.PATIENT;
        $scope.patientObject = newPatientObject.patientObject;
        var stages = [];
        systemConfigService.stages.forEach(function (stage) {
          stages.push(newPatientObject.patientObject.STAGES[stage.dataType]);
        });
        $scope.patientStages = listToMatrix(stages, 2);
        $scope.responsable = newPatientObject.patientObject.RESPONSABLE;
        $scope.observation = newPatientObject.patientObject.OBSERVATION;
        $scope.disabled= true;
        $scope.replacePatient = false;
        $scope.patientBackup = angular.copy($scope.patient);
        $scope.resposableBackup = angular.copy($scope.responsable);
        $scope.observationBackup =  angular.copy($scope.observation);
        $scope.stagesChanged = true;
      }).catch(function (err) {
        console.log(err);
      });
    }

    function replaceCurrentPatient () {
      $scope.patientObject.PATIENT = $scope.patient;
      return patientService.createImportPatientObject($scope.patientObject).then( function (objResult) {
        return replacePatientObject(objResult);
      })
    }

    function updatePatient () {
      $scope.disabled= true;
      $scope.patientBackup = angular.copy($scope.patient);
      $scope.resposableBackup = angular.copy($scope.responsable);
      $scope.observationBackup = angular.copy($scope.observation);
      return patientService.updatePatient($scope.patientId, $scope.patient, $scope.responsable, $scope.observation).catch( function (error) {
        console.log(error);
      });
    }

    $scope.cancelEdit = function () {
      $scope.disabled= true;
      $scope.patient = null;
      $scope.patient = angular.copy($scope.patientBackup);
      $scope.responsable = angular.copy($scope.resposableBackup);
      $scope.observation = angular.copy($scope.observationBackup);
      $scope.forms.form1.$setPristine();
      $scope.forms.form1.$setValidity();
      $scope.forms.form1.$setUntouched();
    };

    $scope.disabled= true;

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

   function parseDate (date) {
     if (date) {
         return moment(date).format('DD/MM/YYYY');
     }
     return null;
   }


  }]);
