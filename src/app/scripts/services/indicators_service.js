'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.indexesService
 * @description
 * # indexesService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('indicatorsService', [ 'pouchDbService', 'systemConfigService', '$translate', function (pouchDbService, systemConfigService,$translate) {

    var service = {
      getIndicators:getIndicators,
      lookupIndicatorIndex:lookupIndicatorIndex,
      getIndexesNames:getIndexesNames
    };

    function getIndicators () {
      return service.indicators;
    }

    service.initIndicatorsIndexes = pouchDbService.getIndicatorsDatabase.then( function (db) {
      service.db = db;
      var indicators_meta;
      return db.get('indicators_meta').then( function (indicators_meta_r) {
        indicators_meta = indicators_meta_r;
        var translatePromises = indicators_meta.indicators.map( function (indicator_m) {
          return $translate([indicator_m.name, indicator_m.description,indicator_m.indexAName, indicator_m.indexBName]);
        })
        return Promise.all(translatePromises);
      }).then(function (translation_results) {
        service.indicators = [];
        for (var i = 0; i < indicators_meta.indicators.length; i++) {
          var indicator_val = indicators_meta.indicators[i];
          indicator_val.nameTranslated = translation_results[i][indicator_val.name];
          indicator_val.descriptionTranslated = translation_results[i][indicator_val.description];
          indicator_val.indexANameTranslated = translation_results[i][indicator_val.indexAName];
          indicator_val.indexBNameTranslated = translation_results[i][indicator_val.indexBName];
          service.indicators.push(indicator_val);
        }
        console.log(service.indicators);
        service.indexes = indicators_meta.indexes;
      }).catch(function(err){
        console.log(err);
      })

    })

    function getIndexesNames() {
      var indexesObj = {};
      service.indexes.forEach( function(indexObj){
        var name = indexObj.index._id.replace("_design/", "");
        indexesObj[name] = indexObj.nameKey;
      })
      return Promise.resolve(indexesObj);
    }

    function lookupIndicatorIndex (index , anual) {
      var groupLevel = anual ? 1 : 2;
      var today = moment();
      var month = today.format('MM').toString();
      var year = today.format('YYYY').toString();
      var startkey = anual ? ["1899",{},{}]:["1899","01",{}];
      var endKey = anual ? [year,{},{}]:[year,month,{}];
      return service.db.query(index, {
        reduce: true,
        group_level: groupLevel,
        startkey:startkey ,
        endkey:endKey
      }).then( function (result) {
        return result;
      }).catch( function (err) {
        console.log(err);
      });
    }

    return service;
    // AngularJS will instantiate a singleton by calling "new" on this function
  }]);
