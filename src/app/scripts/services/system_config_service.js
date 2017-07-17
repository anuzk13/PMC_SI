'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.systemConfigService
 * @description
 * # systemConfigService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('systemConfigService', ['pouchDbService' , function (pouchDbService) {
    // AngularJS will instantiate a singleton by calling "new" on this function

    var service = {
      getPatientStages : getPatientStages,
      getShortStages:getShortStages,
      getPatientIDTypes:getPatientIDTypes,
      getGrowthChartMeta: getGrowthChartMeta,
      getCollectorSettings:getCollectorSettings,
      getColumnTitles:getColumnTitles,
      getVaccineTypes:getVaccineTypes,
      getExamTypes:getExamTypes,
      getDeathPlaces:getDeathPlaces,
      getFoodSupplyTypes:getFoodSupplyTypes,
      getDefaultLanguage: getDefaultLanguage,
      getSexTypes:getSexTypes,
      getIndicatorMetadata:getIndicatorMetadata,
      getDocTypes:getDocTypes,
      getDXTypes:getDXTypes,
      getExitCriteria:getExitCriteria,
      getDataTypes:getDataTypes,
      getSavedCustomColumns:getSavedCustomColumns,
      getAllUniqueValues:getAllUniqueValues,
      getImportColumns:getImportColumns,
      saveCustomColumns:saveCustomColumns,
      updateDataCollectorSettings:updateDataCollectorSettings
    }
    //if MyOtherService depends on MyService it should not resolve before MyService
    //you can chain promises
    service.initDefaultConfig = pouchDbService.getConfDatabase.then(function(db){
      return Promise.all([db.get("data_collector_settings"),db.get("patient_stages")]).then(function(stagesResults){
          console.log(stagesResults[0].DefaultStages);
          service.db = db;
          assignServiceStages (stagesResults[0].DefaultStages, stagesResults[1].Stages);
          service.importDataTypes = stagesResults[0].ImportDataTypes;
          service.shortStages = stagesResults[0].DefaultStages;
        }).catch(function (err){
          console.log(err);
      });
    });

    function getShortStages() {
      return service.shortStages;
    }


    function getDeathPlaces () {
      return getUniqueValues ("DEATH_PLACE").then (function (result) {
        return result;
      });
    }

    function getPatientIDTypes () {
      return getUniqueValues ("PATIENT_ID_TYPE").then (function (result) {
        return result;
      });
    }

    function getDataTypes () {
      return service.db.get("data_types").then( function (doc){
        return doc;
      }).catch( function (err) {
        console.log(err);
      })
    }

    function getDXTypes() {
      return getUniqueValues ("DX").then (function (result) {
        return result;
      });
    }

    function getSavedCustomColumns() {
      return service.db.get("saved_custom_cols").then( function (doc){
        return doc;
      }).catch( function (err) {
        console.log(err);
      })
    }

    function saveCustomColumns (usedCols, unusedCols) {
      return service.db.get("saved_custom_cols").then( function (doc){
        doc.UsedCols = usedCols;
        doc.UnusedCols =unusedCols;
        return service.db.put(doc)
      }).catch( function (err) {
        console.log(err);
      })
    }

    function getIndicatorMetadata () {
      return service.db.get("indicators_meta").then( function (doc) {
        return doc;
      }).catch( function (err) {
        console.log(err);
      })
    }

    function getAllUniqueValues () {
      return service.db.get("unique_values").then( function (doc){
        return doc;
      }).catch( function (err) {
        console.log(err);
      })
    }

    function getImportColumns() {
      var columns = []
      return getAllColumnTypes().then( function (colTypes) {
        colTypes.forEach(function (colType){
          service.importDataTypes.forEach (function (importDataType) {
            if (colType.type == importDataType) {
              columns.push(colType);
            }
          });
        })
        return columns;
      });
    };

    function getGrowthChartMeta() {
      return service.db.get("growth_charts").then(function(doc) {
        return doc;
      }).catch(function (err){
        console.log(err);
      })
    };

    function getPatientStages () {
      return service.db.get("patient_stages").then(function(doc) {
        return doc;
      }).catch(function (err){
        console.log(err);
      })
    };

    function getCollectorSettings () {
      return service.db.get("data_collector_settings").then(function(doc) {
        console.log(doc);
        return doc;
      }).catch(function (err){
        console.log(err);
      })
    };

    function getVaccineTypes () {
      return getUniqueValueGroup ("VACCINES").then (function (result) {
        return result;
      });
    };

    function getExamTypes () {
      return getUniqueValueGroup ("EXAMS").then (function (result) {
        return result;
      });
    };

    function getFoodSupplyTypes() {
      return getUniqueValues ("FOOD_SUPPLY").then (function (result) {
        return result;
      });
    };

    function getDefaultLanguage() {
      return localStorage.getItem('DefaultLanguage');
    };

    function getSexTypes () {
      return getUniqueValues ("SEX").then (function (result) {
        return result;
      });
    };

    function getDocTypes () {
      return getUniqueValues ("ID_TYPE").then (function (result) {
        return result;
      });
    };

    function getExitCriteria() {
      return getUniqueValueGroup ("EXIT_CRITERIA").then (function (result) {
        return result;
      });
    };

    function updateDataCollectorSettings(stages, importTypes) {
      console.log(stages);
      return Promise.all([service.db.get("patient_stages"), service.db.get("data_collector_settings")]).then( function (results) {
        var patientSettings = results[0];
        var doc = results[1];
        console.log(patientSettings, doc)
        assignServiceStages (stages, patientSettings.Stages)
        doc.DefaultStages = stages || doc.DefaultStages;
        doc.ImportDataTypes = importTypes ||doc.ImportDataTypes;
        console.log(doc);
        console.log( service.stages , service.allStages );
        return service.db.put(doc).then(function (result) {
          console.log(result);
          return result;
        }).catch(function (err){
          console.log(err);
        })
      }).catch( function (err) {
        console.log(err);
      })
    }

    return service;

    function getUniqueValues ( uniqueValueName ){
      return service.db.get("unique_values").then( function (doc) {
        var result = null;
        doc.uniqueValues.forEach (function (uniqueVal) {
          if (uniqueVal.name == uniqueValueName ) {
            result = uniqueVal.values;
          }
        })
        return result;
      }).catch( function (err) {
        console.log(err);
      })
    };

    function getUniqueValueGroup ( uniqueGroupName ) {
      var groupedValues = [];
      return service.db.get("unique_values").then( function (doc) {
        doc.uniqueValues.forEach (function (uniqueVal) {
          if (uniqueVal.group_key == uniqueGroupName ) {
            groupedValues.push({nameKey:uniqueVal.nameKey,  value: uniqueVal.name})
          }
        })
        return groupedValues;
      }).catch( function (err) {
        console.log(err);
      })
    };

    function getColumnTitles () {
      var titles = [];
      return service.db.get("data_types").then( function (dataTypes) {

        for ( var typeKey in dataTypes.Types ) {
          dataTypes.Types[typeKey].columns.forEach (function (col) {
            titles.push(col.title);
          })
        }
        return titles;
      })
    }

    function getAllColumnTypes () {
      return Promise.all( [service.db.get("patient_stages"),
                    service.db.get("data_types") ])
      .then( function (results) {

        var patientStages = results[0].Stages;
        var dataTypes = results[1].Types;

        var columnsResult = [];

        for ( var typeKey in dataTypes ) {
          var dataType = dataTypes[typeKey];
          if (typeKey === "STAGES") {
            var objects = createStagesTypeObjects (dataType,patientStages);
            columnsResult = columnsResult.concat(objects) ;
          } else {
            var object = createTypeObject (typeKey, dataType);
            columnsResult = columnsResult.concat(object) ;
          }
        }

        return Promise.all(columnsResult);

      }).catch( function (err) {
        console.log(err);
      })
    }

    function createTypeObject (typeKey, dataType, customExportTitles) {
      var columns = angular.copy(dataType.columns);
      return Promise.all(
        columns.map ( function (column) {
          var isExportable = true;
          if ( customExportTitles ) {
            isExportable = false;
            for (var i = 0; i < customExportTitles.length; i++) {
              var title = customExportTitles[i];
              if (column.title == title) {
                isExportable = true;
                break;
              }
            }
          }
          if (isExportable) {
            column.property = "PATIENT." + typeKey + "." + column.property;
            if (column.uniqueValues) {
              return getUniqueValues(column.uniqueValues).then( function (uniqueValResult) {
                column.uniqueValues = uniqueValResult;
                return column;
              })
            } else {
              return Promise.resolve(column);
            }
          } else {
            return Promise.resolve(null);
          }
        })
      ).then( function (columns) {
        var cols = [];
        columns.forEach( function (col) {
          if (col) {
            cols.push(col)
          }
        })
        return { nameKey : angular.copy(dataType.nameKey) , columns:cols , type:typeKey };
      }).catch( function (err) {
        console.log(err);
      })
    }

    function createStagesTypeObjects (dataType ,patientStages, customExportTitles, customExpStages) {
      var stagesPromises = [];
      if (customExpStages) {
        for (var i = 0; i < customExpStages.length; i++) {
          stage = patientStages[customExpStages[i]]
          stagesPromises.push(createStageObject (stage, dataType, customExportTitles) );
        }
      } else {
        for ( var stageKey in patientStages) {
          var stage = patientStages[stageKey];
          stagesPromises.push(createStageObject (stage, dataType, customExportTitles) )
        }
      }
      return stagesPromises;
    }

    function createStageObject (stage, dataType, customExportTitles) {
      return createTypeObject(stage.dataType,dataType, customExportTitles).then( function (typeObject) {
        typeObject.nameKey = stage.nameKey;
        typeObject.columns.forEach ( function (column) {
          column.property = "PATIENT.STAGES" + "." + column.property.replace("PATIENT.","");
          column.exportLabel = stage.exportLabel;
          column.typeLabel = stage.typeLabel;
        })
        return typeObject;
      })
    }

    function assignServiceStages (defaultStages, systemStages) {
      var stages = [];
      defaultStages.forEach(function (defaultStage) {
        stages.push(systemStages[defaultStage]);
      });
      var allStages = [];
      for (var key in systemStages) {
        allStages.push(systemStages[key]);
      }
      stages.sort(function(a, b){return Number(a.correctedAge)-Number(b.correctedAge)});
      service.stages = stages;
      service.allStages = allStages;
    }


  }]);
