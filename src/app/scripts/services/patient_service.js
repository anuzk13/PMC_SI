'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.patientService
 * @description
 * # patientService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('patientService', ['pouchDbService', 'systemConfigService' , function (pouchDbService, systemConfigService)  {

    var service = {
      calculateEventStage:calculateEventStage,
      createImportPatientObject:createImportPatientObject,
      createPatient:createPatient,
      createPatientAccess:createPatientAccess,
      createPatientDecease:createPatientDecease,
      createPatientDesertion:createPatientDesertion,
      createPatientIntrahospAccess:createPatientIntrahospAccess,
      createPatientTraslation:createPatientTraslation,
      deletePatient:deletePatient,
      editPatientStages:editPatientStages,
      getAllPatientData:getAllPatientData,
      getAllPatientStages:getAllPatientStages,
      getDataBaseObject:getDataBaseObject,
      getCorrectedGestAge:getCorrectedGestAge,
      getMonthPatientData:getMonthPatientData,
      getPatient:getPatient,
      getPatients:getPatients,
      getPatientAccess:getPatientAccess,
      getPatientDecease:getPatientDecease,
      getPatientDesertion:getPatientDesertion,
      getPatientObject:getPatientObject,
      getPatientHistories:getPatientHistories,
      getPatientIntrahospAccess:getPatientIntrahospAccess,
      getPatientResponsable:getPatientResponsable,
      getPatientStage:getPatientStage,
      getPatientTraslation:getPatientTraslation,
      getStagePendientsUntilToday:getStagePendientsUntilToday,
      registerPatientAttention:registerPatientAttention,
      registerPatientHospitalization:registerPatientHospitalization,
      removePatientAttention:removePatientAttention,
      removePatientHospitalization:removePatientHospitalization,
      savePatientImport:savePatientImport,
      updatePatient:updatePatient,
      updatePatientAccess:updatePatientAccess,
      updatePatientDecease:updatePatientDecease,
      updatePatientDesertion:updatePatientDesertion,
      updatePatientIntrahospAccess:updatePatientIntrahospAccess,
      updatePatientStage:updatePatientStage,
      updatePatientTraslation:updatePatientTraslation
    };

    service.initDatabase = pouchDbService.getPatientsDatabase.then(function(db){
      service.db = db;
      return service.db;
    }).catch(function(err){
      console.log(err);
    });

    return service;

    function deletePatient (patientID) {
      return service.db.get(patientID).then(function (doc) {
        return service.db.remove(doc);
      }).catch(function (err) {
        console.log(err)
        return null;
      });
    };

    function editPatientStages (patientID, patientData) {

       if (patientData.AMBULATORY_PROGRAM) {
         var correctedGestAge = getCorrectedGestAge (patientData.PATIENT.GestationalAge, patientData.AMBULATORY_PROGRAM.DateAccess, patientData.PATIENT.BirthDate);
         patientData.AMBULATORY_PROGRAM.GestationalAgeCorrected = correctedGestAge;
       }

       return createImportPatientObject(patientData, false).then( function (importPatient) {

         console.log(importPatient);
         var patientObj = importPatient.patientObject;
         console.log(patientObj);
         if (patientObj.PATIENT.hospitalizations){
           patientObj.PATIENT.hospitalizations.forEach(function (hosp, index){
            patientObj = removeHospitalization (patientObj, index);
            patientObj =  createHospitalization (patientObj, hosp.hospitalizationDate);
           })
         }
         if (patientObj.PATIENT.attentions) {
           patientObj.PATIENT.attentions.forEach(function (att, index){
             patientObj = removeAttention (patientObj, index);
             patientObj = createAttention (patientObj, att.attentionDate);
           })
         }

         console.log(patientData, patientObj)

         return {"patientObject":patientObj, "_id": importPatient._id};
       });
    }

    function getCorrectedGestAge (gestationalAge, accessDate, birthDate) {
      var patientBirth = moment(birthDate, 'DD/MM/YYYY');
      var patientAccess = moment(accessDate);
      var diff = moment.duration(patientAccess.diff(patientBirth));
      var weekDuration = parseInt(diff.asWeeks());
      var dayDuration = parseInt(diff.asDays());
      var gestCorrected = parseFloat(weekDuration+ "." + dayDuration%7);
      return gestCorrected + parseFloat(gestationalAge);
    }

    function createImportPatientObject (importObject, stagesComplete) {
      var patientObject = {};
      patientObject.type = 'PATIENT';
      var patientData = importObject.PATIENT;
      if ( patientData &&
           patientData.BirthDate &&
           patientData.GestationalAge &&
           moment(patientData.BirthDate, ['DD/MM/YYYY']).isValid()) {

             var patientBirth = moment(patientData.BirthDate, 'DD/MM/YYYY');
             var weekBornCorrection = 40 - patientData.GestationalAge;
             var sep = pouchDbService.elementSeparator;
             var correctedBirthDate = patientBirth.add(weekBornCorrection, 'week');
             var patientID = 'PATIENT'+ sep + patientData.SocialRegistry;
             patientObject.PATIENT = importObject.PATIENT;
             patientObject.PATIENT.type = 'PATIENT';
             patientObject.PATIENT.CorrectedBirthDate = correctedBirthDate.format('DD/MM/YYYY');

             return createStageObject(patientData, patientID, stagesComplete).then( function (stagesObject) {
               console.log(stagesObject);
               return cloneStagesProperties (importObject.STAGES, stagesObject);
             }).then( function (clonedStages) {
               patientObject.STAGES = clonedStages;
               if (importObject.AMBULATORY_PROGRAM) {
                 patientObject.AMBULATORY_PROGRAM = createPatientVariable (importObject, 'AMBULATORY_PROGRAM' , patientID);
               }
               if (importObject.RESPONSABLE) {
                 patientObject.RESPONSABLE = createPatientVariable (importObject, 'RESPONSABLE' , patientID);
               }
               if(importObject.OBSERVATION){
                 patientObject.OBSERVATION = createPatientVariable (importObject, 'OBSERVATION' , patientID);
                 patientObject.OBSERVATION.Died =  patientObject.OBSERVATION.Died ? patientObject.OBSERVATION.Died : false;
                 patientObject.OBSERVATION.Deserted =  patientObject.OBSERVATION.Deserted ? patientObject.OBSERVATION.Deserted : false;
                 patientObject.OBSERVATION.HasHospitalization =  patientObject.OBSERVATION.HasHospitalization ? patientObject.OBSERVATION.HasHospitalization : false;
               } else {
                 patientObject.OBSERVATION = {
                   patientID:patientID,
                   type:'OBSERVATION',
                   Died:false,
                   Deserted:false,
                   HasHospitalization:false
                 }
               }
               if(importObject.INTRAHOSPITALARY_PROGRAM) {
                 patientObject.INTRAHOSPITALARY_PROGRAM = createPatientVariable (importObject, 'INTRAHOSPITALARY_PROGRAM' , patientID);
               }
               if(importObject.DESERTION){
                 patientObject.DESERTION = createPatientVariable (importObject, 'DESERTION' , patientID, patientObject.STAGES);
               }
               if(importObject.DECEASE){
                 patientObject.DECEASE = createPatientVariable (importObject, 'DECEASE' , patientID, patientObject.STAGES);
               }
               if (importObject.TRASLATION) {
                  patientObject.TRASLATION = createPatientVariable (importObject, 'TRASLATION' , patientID, patientObject.STAGES);
               }
               return {'patientObject': patientObject, '_id':patientID} ;
             })
      }
    }

    function savePatientImport (patientID , patientObject, replaceOriginal ) {
      return service.db.upsert(patientID,function (doc) {
        if (doc._id && !replaceOriginal) {
          //if doc exists and I dont want to replace the original data
          console.log(patientObject, doc)
          return angular.merge(patientObject , doc );
        } else {
          return angular.merge(doc, patientObject)
        }
      }).then( function (result) {
        console.log("RSULTADO", result)
        return result;
      }).catch(function (err) {
        console.log(err);
        return null;
      });
    }

    function createPatientVariable (importObject, type , patientID, stages) {
      var obj = importObject[type];
      obj.Patient_id = patientID;
      obj.type = type;
      if (stages && obj.Date && moment(obj.Date, ['DD/MM/YYYY']).isValid() ) {
        var stage = calculateEventStage(stages , obj.Date);
        obj.Stage = stage;
      }
      return obj;
    }

    function cloneStagesProperties (stagesOrigin, stagesDest) {
      if (stagesOrigin) {
        var objResult = {};
        for (var stageKey in stagesDest){
          if (stagesOrigin[stageKey]) {
            objResult[stageKey] =  cloneProperties(stagesOrigin[stageKey] , stagesDest[stageKey])
          } else {
            objResult[stageKey] = stagesDest[stageKey];
          }
        }
        console.log(objResult);
        return objResult;
      } else {
        return stagesDest;
      }

    }

    function cloneProperties (objA, objB) {
      for (var key in objA) {
        if (!objB[key]) {
          objB[key] = objA[key];
        } else if (angular.isObject(objB[key])){
          objB[key] = cloneProperties(objA[key],objB[key]);
        }
      }
      return objB;
    }

    function createPatient (patientData, patientResponsable) {
      var patientObject = {};
      var sep = pouchDbService.elementSeparator;
      var patientID = 'PATIENT'+ sep + patientData.SocialRegistry;
      patientObject.type = 'PATIENT';
      patientData.type = 'PATIENT';
      patientObject.PATIENT = patientData;
      patientResponsable.type = 'RESPONSABLE';
      patientObject.RESPONSABLE = patientResponsable;
      patientObject.OBSERVATION = {
        patientID:patientID,
        type:'OBSERVATION',
        Died:false,
        Deserted:false,
        HasHospitalization:false
      }
      if (moment(patientData.BirthDate, ['DD/MM/YYYY']).isValid()) {
        var patientBirth = moment(patientData.BirthDate, 'DD/MM/YYYY');
        var weekBornCorrection = 40 - patientData.GestationalAge;
        var correctedBirthDate = patientBirth.add(weekBornCorrection, 'week');
        patientData.CorrectedBirthDate = correctedBirthDate.format('DD/MM/YYYY');
        patientResponsable.Patient_id = patientID;
        return createStageObject(patientData, patientID, false).then( function(stagesObject) {
          patientObject.STAGES = stagesObject;
          return service.db.putIfNotExists(patientID, patientObject);
        }).then(function (results) {
          if (results.error) {
            return Promise.resolve(results);
          } else {
            return Promise.resolve({patientID:patientID, patientObject:patientObject});
          }
        }).catch(function (err) {
          console.log(err)
        });
      } else {
          return Promise.resolve({error: "DateFormatInvalid"});
      }
    }

    function createPatientAccess (patientID, patientAccess) {
      return service.db.get(patientID).then(function (doc) {
        patientAccess.Patient_id = patientID;
        patientAccess.type ='AMBULATORY_PROGRAM';
        doc.AMBULATORY_PROGRAM = patientAccess;
        return service.db.put(doc);
      }).then(function (response) {
        return response;
      }).catch(function (err){
        console.log(err);
      });
    }

    function createPatientDecease (patientID, patientDecease) {
      return service.db.get(patientID).then(function (doc) {
        var stage = calculateEventStage(doc.STAGES ,patientDecease.Date);
        patientDecease.Stage = stage;
        patientDecease.Patient_id = patientID;
        patientDecease.type = 'DECEASE';
        doc.DECEASE = patientDecease;

        if (!doc.OBSERVATION) {
          doc.OBSERVATION = createObservationObject(patientID)
        }

        //Update Observation property
        doc.OBSERVATION.Died = true;

        return service.db.put(doc);
      }).then(function (response) {
        return patientDecease;
      }).catch(function (err){
        console.log(err);
      });
    }

    function calculateEventStage (patientStages, eventDate ) {
      var eventDate = moment(eventDate, "DD/MM/YYYY");
      var minStage;
      var minStageName;
      var eventBefore = false;
      for (var key in patientStages) {
        var stage = patientStages[key];
        if (stage.DateStageReached) {
          var dateReached = moment(stage.DateStageReached, "DD/MM/YYYY");
          if (eventDate.isBefore(dateReached)) {
            minStage = minStage ? ( minStage.isBefore(dateReached) ? minStage : dateReached ) : dateReached;
            minStageName = minStageName ? (  minStage.isBefore(dateReached) ? minStageName : stage.type ) : stage.type;
          }
        }
      }
      return minStageName;
    }

    function createPatientDesertion (patientID, patientDesertion) {
      return service.db.get(patientID).then(function (doc) {
        var stage = calculateEventStage(doc.STAGES,patientDesertion.Date);
        patientDesertion.Stage = stage;
        patientDesertion.Patient_id = patientID;
        patientDesertion.type = 'DESERTION';
        doc.DESERTION = patientDesertion;

        if (!doc.OBSERVATION) {
          doc.OBSERVATION = createObservationObject(patientID)
        }

        //Update Observation property
        doc.OBSERVATION.Deserted = true;

        return service.db.put(doc);
      }).then(function (response) {
        return patientDesertion;
      }).catch(function (err){
        console.log(err);
      });
    }

    function createPatientIntrahospAccess (patientID, patientAccess) {
      return service.db.get(patientID).then(function (doc) {
        patientAccess.Patient_id = patientID;
        patientAccess.type = 'INTRAHOSPITALARY_PROGRAM';
        doc.INTRAHOSPITALARY_PROGRAM = patientAccess;
        return service.db.put(doc);
      }).then(function (response) {
        return response;
      }).catch(function (err){
        console.log(err);
      });
    }

    function createPatientTraslation (patientID, patientTraslation) {
      return service.db.get(patientID).then(function (doc) {
        var stage = calculateEventStage(doc.STAGES, patientTraslation.Date);
        patientTraslation.Stage = stage;
        patientTraslation.Patient_id = patientID;
        patientTraslation.type = 'TRASLATION';
        doc.TRASLATION = patientTraslation;
        return service.db.put(doc);
      }).then(function (response) {
        return patientTraslation;
      }).catch(function (err){
        console.log(err);
      });
    }

    function getAllPatientData () {
      return service.db.query('indexByPatient');
    };

    function getMonthPatientData ( year, month) {
      var startkey = [year + "" ,month + ""];
      var endKey = [year + "",month + ""];
      return service.db.query('indexByAccess', {
        startkey:startkey ,
        endkey:endKey
      }).then( function (result) {
        return result;
      });
    };

    function getPatientHistories(query) {
      return service.db.query('indexByConsecutive', {
        startkey:query ,
        endkey:query + '\uffff'
      }).then( function (result) {
        return result.rows;
      });
    }

    function getAllPatientStages (patientID) {
      return service.db.get(patientID).then (function (doc){
        return doc.STAGES;
      }).catch(function (err) {
        console.log(err);
      })
    };

    function getDataBaseObject (objectId) {
      return service.db.get(objectId);
    }

    function createStageObject (patientData, patientID, stagesComplete) {
      console.log(patientID,stagesComplete);
      var stagesObject = {
        type: "STAGES",
        "Patient_id":patientID
      };

      //Create stages
      return systemConfigService.getPatientStages().then(function (result) {
        var stages = result.Stages;
        for (var stageKey in stages) {
          var stage = stages[stageKey];
          var stageReach;
          var stageReachMonth;
          if (stage.dataType.endsWith('G')){
            //See if baby should have 40 weeeks gestational age
            stageReach =  moment(patientData.CorrectedBirthDate, "DD/MM/YYYY");
          } else {
            var monthDuration = stage.durationMonths;
            stageReach = moment(patientData.CorrectedBirthDate, "DD/MM/YYYY").add(monthDuration, 'month');
          }
          var objSt = {
            "DateStageReached":stageReach.format("DD/MM/YYYY"),
            "Patient_id":patientID,
            "MonthReachedName":stageReach.format("MMMM").toUpperCase(),
            "Complete":stagesComplete,
            "type":stage.dataType
          }
          stagesObject[stage.dataType] = objSt;
        }

        return stagesObject;
      });
    };


    function getPatient(patientID){
      return service.db.get(patientID).then(function (doc) {
        return doc.PATIENT;
      }).catch(function (err) {
        console.log(err);
      });
    };

    function getPatientObject(patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc;
      }).catch(function (err) {
        console.log(err);
      });
    }

    function getPatients () {
      return service.db.allDocs({
        include_docs:true,
        startkey: 'PATIENT',
        endkey: 'PATIENT'+'\uffff'
      }).then(function (result){
        return result.rows;
      }).catch(function(err){
        console.log(err);
      });
    };

    function getPatientAccess (patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.AMBULATORY_PROGRAM;
      }).catch(function (err) {
        console.log(err);
        return null;
      });
    };

    function getPatientDecease (patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.DECEASE;
      }).catch(function (err) {
        console.log(err);
        return null;
      });
    }

    function getPatientDesertion (patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.DESERTION;
      }).catch(function (err) {
        console.log(err);
        return null;
      });
    }

    function getPatientTraslation(patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.TRASLATION;
      }).catch(function (err) {
        console.log(err);
        return null;
      });
    }

    function getPatientIntrahospAccess(patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.INTRAHOSPITALARY_PROGRAM;
      }).catch(function (err) {
        console.log(err);
      });
    }

    function getPatientResponsable (patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.RESPONSABLE;
      }).catch(function (err) {
        console.log(err);
      });
    };

    //Retun a given stage for a patient
    function getPatientStage (stage,  patientID) {
      return service.db.get(patientID).then(function (doc) {
        return doc.STAGES[stage];
      }).catch(function (err) {
        console.log(err);
      });
    };

    //Return all stages that are incomplete until the today
    function getStagePendientsUntilToday (stageName) {
      var today =moment();
      var DateStageReached = today.format('YYYY/MM/DD');
      return service.db.query(
        'indexStages',
        {
          startkey: stageName+DateStageReached+'\uffff',
          limit:3,
          descending : true,
          endkey: stageName
        });
    };

    function createAttention (doc, date) {
      var stage = calculateEventStage(doc.STAGES , date);
      if (!doc.PATIENT.attentions) {
        doc.PATIENT.attentions= [];
      }
      //Save the hospitalizations array
      var attentionObject = {"attentionDate":date, "attentionStage":stage};
      doc.PATIENT.attentions.push(attentionObject);
      return doc;
    }

    function registerPatientAttention (patientId, date) {
      var attentionRet;
      return service.db.get(patientId).then(function(doc){
        doc = createAttention (doc, date);
        attentionRet = doc.PATIENT.attentions;
        return service.db.put(doc);
      }).then(function (response) {
        return attentionRet;
      }).catch(function (err){
        console.log(err);
      });
    }

    function createHospitalization (doc, date) {
      var stage = calculateEventStage(doc.STAGES , date);
      if (!doc.PATIENT.hospitalizations) {
        doc.PATIENT.hospitalizations= [];
      }
      //Save the hospitalizations array
      var hospObject = {"hospitalizationDate":date, "hospitalizationStage":stage};
      doc.PATIENT.hospitalizations.push(hospObject);

      //Update the stages
      if (doc.STAGES[stage] && !doc.STAGES[stage].WasHospitalized) {
        doc.STAGES[stage].WasHospitalized = true;
      }
      if (!doc.OBSERVATION) {
        doc.OBSERVATION = createObservationObject(patientId)
      }
      //Save the Observations
      doc.OBSERVATION.HasHospitalization = true;
      return doc;
    }

    function registerPatientHospitalization (patientId, date) {
      var hospRet;
      return service.db.get(patientId).then(function(doc){
        doc = createHospitalization (doc, date) ;
        hospRet = doc.PATIENT.hospitalizations;
        return service.db.put(doc);
      }).then(function (response) {
        return hospRet;
      }).catch(function (err){
        console.log(err);
      });
    }

    function removeAttention (doc, index) {
      if (index > -1 && doc.PATIENT.attentions) {
        doc.PATIENT.attentions.splice(index, 1);
      }
      return doc;
    }

    function removePatientAttention (patientId, index) {
      var attentionRet;
      return service.db.get(patientId).then(function(doc){
        doc =removeAttention (doc, index);
        attentionRet = doc.PATIENT.attentions;
        return service.db.put(doc);
      }).then(function (response) {
        return attentionRet;
      }).catch(function (err){
        console.log(err);
      });
    }

    function removeHospitalization (doc, index) {
      var hospStage = doc.PATIENT.hospitalizations [index].hospitalizationStage;
      doc.PATIENT.hospitalizations.splice(index, 1);
      //Update Stages
      if (doc.STAGES[hospStage]) {
        var stageExists = false;
        for (var i = 0; i < doc.PATIENT.hospitalizations.length; i++) {
          var name = doc.PATIENT.hospitalizations[i].hospitalizationStage;
          if (name == hospStage) {
            stageExists = true;
            break;
          }
        }
        if (!stageExists ) {
          doc.STAGES[hospStage].WasHospitalized = false;
        }
      }

      if (!doc.OBSERVATION) {
          doc.OBSERVATION = createObservationObject(patientId)
      }
      //Update Observations
      if (doc.PATIENT.hospitalizations.length == 0) {
        doc.OBSERVATION.HasHospitalization = false;
      }
      return doc;
    }

    function removePatientHospitalization (patientId, index) {
      var hospRet;
      return service.db.get(patientId).then(function(doc){
        if (index > -1 && doc.PATIENT.hospitalizations) {
          doc = removeHospitalization(doc, index);
        }
        hospRet = doc.PATIENT.hospitalizations;
        return service.db.put(doc);
      }).then(function (response) {
        return hospRet;
      }).catch(function (err){
        console.log(err);
      });
    }

    function updatePatient (patientID, patientData, responsableData, observationData) {
      return service.db.get(patientID).then(function(doc){
        patientData.type = 'PATIENT';
        doc.PATIENT = patientData;
        if (responsableData) {
          responsableData.type = 'RESPONSABLE';
          responsableData.Patient_id = patientID;
          doc.RESPONSABLE = responsableData;
        }
        if (observationData) {
          observationData.type = 'OBSERVATION';
          observationData.Patient_id = patientID;
          doc.OBSERVATION = observationData;
        }
        return service.db.put(doc).then(
          function (response) {
            return response;
          }).catch(function (err){
            console.log(err);
          })
      }).catch(function (err) {
        console.log(err);
      });
    };

    function updatePatientAccess (patientId, accessData) {
      return service.db.get(patientId).then(function(doc){
        accessData.type = 'AMBULATORY_PROGRAM';
        accessData.Patient_id = patientId;
        doc.AMBULATORY_PROGRAM = accessData;
        return service.db.put(doc).then(
          function (response) {
            return response;
          }).catch(function (err){
            console.log(err);
          })
      }).catch(function (err) {
        console.log(err);
      });
    };

    function updatePatientDecease (patientId, deceaseData) {
      return service.db.get(patientId).then(function(doc){
        var stage = calculateEventStage(doc.STAGES ,deceaseData.Date);
        deceaseData.Stage = stage;
        deceaseData.type = 'DECEASE';
        deceaseData.Patient_id = patientId;
        doc.DECEASE = deceaseData;

        if (!doc.OBSERVATION) {
          doc.OBSERVATION = createObservationObject(patientId)
        }
        //Update Observation property
        doc.OBSERVATION.Died = true;

        return service.db.put(doc);
      }).then(function (response) {
        return deceaseData;
      }).catch(function (err){
        console.log(err);
      });
    };

    function createObservationObject(patientID) {
      var observation = {
        Died:false,
        Deserted:false,
        HasHospitalization:false,
        type:'OBSERVATION',
        Patient_id: patientID
      };
      return observation;
    }

    function updatePatientDesertion ( patientId, desertionData) {
      return service.db.get(patientId).then(function(doc){
        var stage = calculateEventStage(doc.STAGES ,desertionData.Date);
        desertionData.Stage = stage;
        desertionData.type = 'DESERTION';
        desertionData.Patient_id = patientId;
        doc.DESERTION = desertionData;

        if (!doc.OBSERVATION) {
          doc.OBSERVATION = createObservationObject(patientId)
        }

        //Update Observation property
        doc.OBSERVATION.Deserted = true;

        return service.db.put(doc);
      }).then(function (response) {
        return desertionData;
      }).catch(function (err){
        console.log(err);
      });
    };

    function updatePatientIntrahospAccess (patientId, accessData) {
      return service.db.get(patientId).then(function(doc){
        accessData.type = 'INTRAHOSPITALARY_PROGRAM';
        accessData.Patient_id = patientId;
        doc.INTRAHOSPITALARY_PROGRAM = accessData;
        return service.db.put(doc);
      }).then(function (response) {
        return response;
      }).catch(function (err){
        console.log(err);
      });
    };

    //Update  patient stage whith data, is not marked as completed until the user specifies
    function updatePatientStage (stageData, patientID){
        return service.db.get(patientID).then(function(doc) {
          stageData.Patient_id = doc.STAGES[stageData.type].Patient_id;
          doc.STAGES[stageData.type] = stageData;

          //Update Observation property
          if (stageData.type == "STAGE_40WEEKS_G" && stageData.Weight ) {
            if (!doc.OBSERVATION) {
              doc.OBSERVATION = createObservationObject(patientID)
            }
            if (stageData.Weight >= 2500) {
              doc.OBSERVATION.Weight40Weeks = true;
            } else {
              doc.OBSERVATION.Weight40Weeks = false;
            }
          }

          return service.db.put(doc).then(
            function (response) {
              return response;
            }).catch(function (err) {
              console.log(err);
            });
        }).catch(function (err) {
          console.log(err);
        });
    }

    function updatePatientTraslation (patientId, traslationData) {
      return service.db.get(patientId).then(function(doc){
        var stage = calculateEventStage(doc.STAGES ,traslationData.Date);
        traslationData.Stage = stage;
        traslationData.type = 'TRASLATION';
        traslationData.Patient_id = patientId;
        doc.TRASLATION = traslationData;
        return service.db.put(doc);
      }).then(function (response) {
        return desertionData;
      }).catch(function (err){
        console.log(err);
      });
    }

  }]);
