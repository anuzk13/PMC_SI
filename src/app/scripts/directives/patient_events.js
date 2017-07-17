'use strict';

/**
 * @ngdoc directive
 * @name pmcDataCollectorApp.directive:patientEvents
 * @description
 * # patientEvents
 */
angular.module('pmcDataCollectorApp')
  .directive('patientEvents', ['patientService', 'systemConfigService', function (patientService, systemConfigService) {
    return {
      scope: {
        patientId: '=patient',
        stagesChanged: '='
      },
      templateUrl: 'views/patient_events.html',
      link: function postLink($scope, element, attrs) {

            $scope.$watch('stagesChanged', function(change) {
              console.log("HEREEE!")
              initAccess();
              initIntrahospAccess();
              initDeceace();
              initDeserion();
              initTraslation();
              $scope.stagesChanged = false;
            })

            $scope.stages = systemConfigService.allStages;
            var getDeathPlaces = systemConfigService.getDeathPlaces();
            var getSupplyTypes= systemConfigService.getFoodSupplyTypes();
            var getDocTypes = systemConfigService.getDocTypes();
            var getExitCriteria = systemConfigService.getExitCriteria();

            Promise.all([getDeathPlaces,getSupplyTypes,getDocTypes,getExitCriteria]).then( function (results ) {
              $scope.dathPlaces = results[0];
              $scope.foodSupplyTypes = results[1];
              $scope.docTypes = results[2];
              $scope.exitCriteria = results[3];
            }).catch( function (err) {
              console.log(err);
            })

            $scope.eventForms = {};

            $scope.eventsTemplate = {
              name:"patient events template",
              url:"views/patient_events.html"
            };

            $scope.hoursInPosBounds = {
              min: 0,
              max: 24,
              units:"h"
            };

            $scope.gestationalAgeBoundsC = {
              min: 0,
              max: 50,
              units:""
            };

            var today = new Date();
            $scope.maxDate = new Date(
              today.getFullYear(),
              today.getMonth() ,
              today.getDate()+1);

            patientService.getPatient($scope.patientId).then (function (patient) {
              $scope.patient = patient;
            })

            //Patient Access
            //Init the models if they exist
            function initAccess () {
              patientService.getPatientAccess($scope.patientId).then( function (access) {
                if (access) {
                  $scope.previousAccess = true;
                  $scope.access = access;

                  if ($scope.access.DateAccess) {
                    $scope.DateAccess = new Date(moment($scope.access.DateAccess, 'DD/MM/YYYY').toDate().toString());
                  } else {
                    $scope.DateAccess = null;
                  }

                  $scope.accessBackup = angular.copy($scope.access);
                  $scope.dateAccessBackup = angular.copy($scope.DateAccess);

                } else {
                  $scope.access = {};
                  $scope.previousAccess = false;
                }

                  $scope.accessEditMode = false;

              }).catch (function (error) {
                console.log(error);
              });

            }


            $scope.editAccess = function () {
              $scope.accessEditMode = true;
            }

            $scope.accessDateChanged = function () {
              $scope.editAccess();
              if ($scope.eventForms.accessForm.accessDate.$valid) {
                //If exit date calculate the Opportunity
                if ($scope.eventForms.haccessForm.haccessDate.$valid && $scope.HDateExit){
                  var opportunity = calculateOpportunity($scope.HDateExit, $scope.DateAccess);
                  $scope.access.Opportunity = opportunity;
                }
                //Calculate corrected gest age
                var correctedGestAge = patientService.getCorrectedGestAge ($scope.patient.GestationalAge, $scope.DateAccess, $scope.patient.BirthDate)
                $scope.access.GestationalAgeCorrected = correctedGestAge;
              }
            }

            function saveAccess () {
              $scope.accessEditMode = false;
              var promise;
              if ($scope.previousAccess) {
                $scope.access.DateAccess = parseDate ($scope.DateAccess);
                promise = patientService.updatePatientAccess($scope.patientId, $scope.access);
              } else {
                $scope.access.DateAccess = parseDate ($scope.DateAccess);
                promise = patientService.createPatientAccess($scope.patientId, $scope.access);
              }
              return promise;
            }

            function cancelAccess () {
              $scope.accessEditMode = false;
              $scope.access = angular.copy($scope.accessBackup);
              $scope.DateAccess = angular.copy($scope.dateAccessBackup);
              clearForm('accessForm');
            }

            function initIntrahospAccess () {
              patientService.getPatientIntrahospAccess($scope.patientId).then( function (hAccess) {
                if (hAccess) {
                  $scope.previousHAccess = true;
                  $scope.hAccess = hAccess;

                  if ($scope.hAccess.DateAccess) {
                    $scope.HDateAccess = new Date(moment($scope.hAccess.DateAccess, 'DD/MM/YYYY').toDate().toString());
                  } else {
                    $scope.HDateAccess = null;
                  }
                  if ($scope.hAccess.DateExit) {
                    $scope.HDateExit = new Date(moment($scope.hAccess.DateExit, 'DD/MM/YYYY').toDate().toString());
                  } else {
                    $scope.HDateExit = null;
                  }
                  if ($scope.hAccess.AccessCriteria) {
                    $scope.accessCriteria = [];
                    for (var key in $scope.hAccess.AccessCriteria){
                      $scope.accessCriteria.push(key);
                    }
                  }

                  $scope.hAccessBackup = angular.copy($scope.hAccess);
                  $scope.datehAccessBackup = angular.copy($scope.HDateAccess);
                  $scope.datehExitBackup = angular.copy($scope.HDateExit);
                  $scope.accessCriteriaBackup = angular.copy($scope.accessCriteria);

                } else {
                  $scope.previousHAccess = false;
                  $scope.hAccess = {};
                }
                $scope.hAccessEditMode =  false;

                $scope.$watch('accessCriteria', function(old, newv) {
                   if (old && newv && newv.length != old.length) {
                     $scope.hAccessEditMode =  true;
                   }
               });


              }).catch (function (error) {
                console.log(error);
              });
            }

            $scope.editHAccess = function () {
              $scope.hAccessEditMode =  true;
            }

            $scope.hExitDateChanged = function () {
              $scope.editHAccess();
              if ($scope.eventForms.haccessForm.haccessDate.$valid) {
                //If exit date calculate the Opportunity
                if ($scope.eventForms.accessForm.accessDate.$valid && $scope.DateAccess){
                  var opportunity = calculateOpportunity($scope.HDateExit, $scope.DateAccess);
                  $scope.access.Opportunity = opportunity;
                }
              }
            }

            $scope.editHAccessCriteria =  function () {
              if ($scope.eventForms.haccessForm.criteria.$touched) {
                $scope.editHAccess();
              }
            }

            function saveHAccess () {
              saveAccessCriteria();
              $scope.hAccessEditMode = false;
              $scope.hAccess.DateAccess = parseDate ($scope.HDateAccess);
              $scope.hAccess.DateExit = parseDate ($scope.HDateExit);
              var promise;
              if ($scope.previousHAccess) {
                promise = patientService.updatePatientIntrahospAccess($scope.patientId, $scope.hAccess);
              } else {
                promise = patientService.createPatientIntrahospAccess($scope.patientId, $scope.hAccess);
              }
              return promise;
            }

            function cancelHAcces () {
              $scope.hAccessEditMode = false;
              $scope.hAccess = angular.copy($scope.hAccessBackup);
              $scope.HDateAccess = angular.copy($scope.datehAccessBackup);
              $scope.HDateExit = angular.copy($scope.datehExitBackup);
              $scope.accessCriteria = angular.copy($scope.accessCriteriaBackup);
              clearForm('haccessForm');
            }

            function saveAccessCriteria () {
              if ($scope.accessCriteria) {
                $scope.hAccess.AccessCriteria = {};
                $scope.accessCriteria.forEach( function (accessCriteria) {
                  $scope.hAccess.AccessCriteria[accessCriteria] = true;
                });
              }
            }

            $scope.selectAllAC = function (){
              $scope.accessCriteria = [];
              $scope.exitCriteria.forEach( function (exitItem) {
                $scope.accessCriteria.push(exitItem.value);
              });
              $scope.editHAccess();
            }

            $scope.saveAccessTab  = function () {
              if ($scope.accessEditMode && $scope.hAccessEditMode) {
                saveAccess().then (function () {
                  saveHAccess();
                });
              }
              else if ($scope.hAccessEditMode) {
                saveHAccess();
              } else if ($scope.accessEditMode) {
                saveAccess();
              }
            }

            $scope.cancelAccessTabEdit = function () {
              if ($scope.accessEditMode) {
                cancelAccess();
              }
              if ($scope.hAccessEditMode) {
                cancelHAcces();
              }
            }

            function initDeceace () {
              patientService.getPatientDecease($scope.patientId).then( function (decease) {
                if (decease) {
                  console.log(decease, "DECEASE")
                  $scope.previousDecease = true;
                  $scope.decease = decease;
                  if ($scope.decease.Date) {
                    $scope.DeceaseDate = new Date(moment($scope.decease.Date, 'DD/MM/YYYY').toDate().toString());
                  } else {
                    $scope.DeceaseDate = null;
                  }
                  $scope.deceaseBackup = angular.copy($scope.decease);
                  $scope.dateDeceaseBackup = angular.copy($scope.DeceaseDate);
                } else {
                  $scope.previousDecease = false;
                  $scope.decease = {};
                }
              }).catch (function (error) {
                console.log(error);
              });

              $scope.deceaseEditMode =  false;
            }

            $scope.editDecease = function () {
              $scope.deceaseEditMode =  true;
            };

            $scope.saveDecease = function () {
              $scope.deceaseEditMode = false;
              var promise;
              if ($scope.previousDecease) {
                $scope.decease.Date = parseDate ($scope.DeceaseDate);
                promise = patientService.updatePatientDecease($scope.patientId, $scope.decease);
              } else {
                $scope.decease.Date = parseDate ($scope.DeceaseDate);
                promise = patientService.createPatientDecease($scope.patientId, $scope.decease);
              }
              promise.then( function (result) {
                if (result.Stage) {
                  $scope.decease.Stage = result.Stage;
                }
              })
            }

            $scope.cancelDecease = function () {
              $scope.deceaseEditMode = false;
              $scope.decease = angular.copy($scope.deceaseBackup);
              $scope.DeceaseDate = angular.copy($scope.dateDeceaseBackup);
              clearForm('deceaseForm');
            }

            function initDeserion () {
              patientService.getPatientDesertion($scope.patientId).then( function (desertion) {
                if (desertion) {
                  $scope.previousDesertion =  true;
                  $scope.desertion = desertion;
                  if ($scope.desertion.Date) {
                    $scope.DesertionDate = new Date(moment($scope.desertion.Date, 'DD/MM/YYYY').toDate().toString());
                  } else {
                    $scope.DesertionDate = null;
                  }
                } else {
                  $scope.previousDesertion =  false;
                  $scope.desertion = {};
                }
              }).catch (function (error) {
                console.log(error);
              });

              $scope.desertionEditMode = false;
            }

            $scope.editDesertion = function () {
              $scope.desertionEditMode =  true;
              $scope.desertionBackup = angular.copy($scope.desertion);
              $scope.desertionDateBackup = angular.copy($scope.DesertionDate);
            }

            $scope.saveDesertion = function () {
              $scope.desertionEditMode = false;
              var promise;
              if ($scope.previousDesertion) {
                $scope.desertion.Date = parseDate ($scope.DesertionDate);
                promise = patientService.updatePatientDesertion($scope.patientId, $scope.desertion);
              } else {
                $scope.desertion.Date = parseDate ($scope.DesertionDate);
                promise = patientService.createPatientDesertion($scope.patientId, $scope.desertion);
              }
              promise.then( function (result) {
                if (result.Stage) {
                  $scope.desertion.Stage = result.Stage;
                }
              })
            }

            $scope.cancelDesertion = function () {
              $scope.desertionEditMode = false;
              $scope.desertion = angular.copy($scope.desertionBackup);
              $scope.DesertionDate = angular.copy($scope.desertionDateBackup);
              clearForm('desertionForm');
            }

            function initTraslation () {
              patientService.getPatientTraslation($scope.patientId).then( function (traslate) {
                if (traslate) {
                  $scope.previousTraslate =  true;
                  $scope.traslate = traslate;
                  if ($scope.traslate.Date) {
                    $scope.TraslateDate = new Date(moment($scope.traslate.Date, 'DD/MM/YYYY').toDate().toString());
                  } else {
                    $scope.TraslateDate = null;
                  }
                } else {
                  $scope.previousTraslate =  false;
                  $scope.traslate = {};
                }
              }).catch (function (error) {
                console.log(error);
              });

              $scope.traslateEditMode = false;
            }


            $scope.editTraslate = function () {
              $scope.traslateEditMode =  true;
              $scope.traslateBackup = angular.copy($scope.traslate);
              $scope.traslateDateBackup = angular.copy($scope.TraslateDate);
            }

            $scope.saveTraslate = function () {
              $scope.traslateEditMode = false;
              var promise;
              if ($scope.previousTraslate) {
                $scope.traslate.Date = parseDate ($scope.TraslateDate);
                promise = patientService.updatePatientTraslation($scope.patientId, $scope.traslate);
              } else {
                $scope.traslate.Date = parseDate ($scope.TraslateDate);
                promise = patientService.createPatientTraslation($scope.patientId, $scope.traslate);
              }
              promise.then( function (result) {
                if (result.Stage) {
                  $scope.traslate.Stage = result.Stage;
                }
              })
            }

            $scope.cancelTraslate = function () {
              $scope.traslateEditMode = false;
              $scope.traslate = angular.copy($scope.traslateBackup);
              $scope.TraslateDate = angular.copy($scope.traslateDateBackup);
              clearForm('traslateForm');
            }

            function clearForm (formId) {
              $scope.eventForms[formId].$setPristine();
              $scope.eventForms[formId].$setValidity();
              $scope.eventForms[formId].$setUntouched();
            }

            function parseDate (date) {
              if (date) {
                  return moment(date).format('DD/MM/YYYY');
              }
              return null;
            }

            function calculateOpportunity (dateExit, dateAccess){
              var exit = moment(dateExit);
              var access = moment(dateAccess);
              var diff = moment.duration(access.diff(exit));
              var opportunity = parseInt(diff.asDays());
              return opportunity;
            }
      }
    };
  }]);
