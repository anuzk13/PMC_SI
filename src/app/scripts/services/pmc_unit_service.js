'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.hospitalService
 * @description
 * # hospitalService
 * Factory in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .factory('pmcUnitService', ['pouchDbService', function (pouchDbService) {

    var service = {
      getPMCUnit:getPMCUnit,
      getRemotePMCUnitdata:getRemotePMCUnitdata,
      registerPMCUnit:registerPMCUnit,
      updatePMCUnit:updatePMCUnit
    }

    service.db = pouchDbService.getPMCDataDatabase();

    return service;

    function getPMCUnit (){
      return service.db.get("PMC_UNIT").then( function (doc) {
        return doc;
      }).catch(function (err) {
        if (err.message.localeCompare("missing") === 0) {
          return null;
        } else {
          console.log(err);
        }
      })
    };

    function getRemotePMCUnitdata () {
      return pouchDbService.db_remote.get("PMC_UNIT").then( function (doc){
        return doc;
      }).catch(function (err) {
        console.log(err);
        if (err.message.localeCompare("missing") === 0) {
          return null;
        }
      })
    };

    function registerPMCUnit (pmcUnit) {
      pmcUnit._id = "PMC_UNIT";
      pmcUnit.type = "PMC_UNIT";
      console.log(pmcUnit)
      return service.db.putIfNotExists(pmcUnit).then(function(response) {
        return pmcUnit;
      }).catch( function (err){
        console.log(err);
      })
    };

    function updatePMCUnit (pmcUnit) {
      return service.db.get("PMC_UNIT").then(function(doc){
        pmcUnit._id = doc._id;
        pmcUnit._rev = doc._rev;
        return service.db.put(pmcUnit).then(
          function (response) {
            return response;
          }).catch(function (err){
            console.log(err);
          })
      }).catch(function (err) {
        console.log(err);
      });
    }




  }]);
