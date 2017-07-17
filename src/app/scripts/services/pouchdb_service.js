'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.pouchDbService
 * @description
 * # pouchDbService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('pouchDbService', ['pouchDB' , function (pouchDB) {

  //TODO: Implement syuncronization with remote database
  var local_db  = pouchDB('local_db');


	var fs = require('fs');

  var indexByPatient = {
    'map': 'function(doc){if(doc.type == \"PATIENT\" ){	emit (doc._id, doc._id)	}};'
  };

  var indexStages = {
    'map': 'function(doc) { if (doc.type == "PATIENT" && doc.STAGES ) { for (var stageKey in doc.STAGES) { if (stageKey.indexOf("STAGE_") == 0 && !doc.STAGES[stageKey].Complete && !doc.DESERTION && !doc.DECEASE && !doc.TRASLATION  ) { var date=doc.STAGES[stageKey].DateStageReached.split("/");  emit (stageKey+date[2]+"/"+date[1]+"/"+date[0],{patientDoc: doc.PATIENT.SocialRegistry,historyConsecutive:doc.PATIENT.HistoryConsecutive, patientId:doc._id,  dateReached:doc.STAGES[stageKey].DateStageReached}) } } } };'
  };

  var indexByAccess = {
    'map': 'function(doc){if(doc.type == \"PATIENT\" && doc.AMBULATORY_PROGRAM && doc.AMBULATORY_PROGRAM.DateAccess ){ var dateArray = 	doc.AMBULATORY_PROGRAM.DateAccess.split(\"/\"); emit ([dateArray[2], dateArray[1]], doc._id)	}};'
  };

  var indexByConsecutive = {
    'map': 'function(doc){if(doc.type == \"PATIENT\" ){	emit (doc.PATIENT.HistoryConsecutive)	}};'
  };

  var service = {
    elementSeparator:'%',
    connectRemote:connectRemote,
    disconnectRemote:disconnectRemote,
    syncDatabase:syncDatabase
	};

  service.local_db = local_db;

  service.getPMCDataDatabase = function () {
    return local_db;
  }

  service.getIndicatorsDatabase = local_db.get('indicators_meta').then( function (indicators_meta) {
    var metaJson = JSON.parse(fs.readFileSync('pmc_indicators_meta.json', 'utf8'));
    var update = metaJson.update;
    if (update) {
      console.log("here")
      metaJson.update = false;
      var indicatorMeta = metaJson.indicators_meta;
      fs.writeFile('pmc_indicators_meta.json', JSON.stringify(metaJson, null, '\t'), function(err) {
        if(err) {
          console.log(err);
        } else {
          console.log("The file was saved!");
        }
      });
      return local_db.get(indicatorMeta._id).then(function (metaRes) {
        indicatorMeta._rev = metaRes._rev;
        return local_db.put(indicatorMeta).then(function (values) {
          return Promise.all(indicatorMeta.indexes.map( function(indexObject) {
            return local_db.get(indexObject.index._id).then(function (indexRes){
              indexObject.index._rev = indexRes._rev;
              return local_db.put(indexObject.index);
            }).catch( function (err) {
              return local_db.put(indexObject.index);
            });
          }))
        });
      }).then(function (results) {
        return service.local_db;
      }).catch(function(err){
        console.log(err);
      });
    } else {
      console.log("here");
      return service.local_db;
    }
  }).catch( function (err) {
    if (err.message.localeCompare('missing') === 0) {
      var indicatorMeta = JSON.parse(fs.readFileSync('pmc_indicators_meta.json', 'utf8')).indicators_meta;
      return local_db.put(indicatorMeta).then(function (values) {
        return Promise.all(indicatorMeta.indexes.map( function(indexObject) {
          return local_db.putIfNotExists(indexObject.index);
        }))
      }).then(function (results) {
        return service.local_db;
      }).catch(function(err){
        console.log(err);
      });
    }
  })

	service.getConfDatabase = local_db.get('data_collector_settings').then(function (data) {
      var configJson = JSON.parse(fs.readFileSync('pmc_data_configuration.json', 'utf8'));
      var update = configJson.update;
      service.update = update;
      console.log(update, update == true);
      if (update) {
        configJson.update = false;
        var configDocuments = configJson.properties;
        fs.writeFile('pmc_data_configuration.json', JSON.stringify(configJson, null, '\t'), function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("The file was saved!");
          }
        });
        return Promise.all(configDocuments.map(function (document) {
  			    return local_db.get(document._id).then(function (savedDoc) {
     				     document._rev = savedDoc._rev;
                 return local_db.put(document);
     			  }).catch(function (err) {
              return local_db.put(document);
            });
  			 })).then(function (values) {
              console.log(values);
              return service.local_db;
         }).catch(function(err){
  				console.log(err);
  			});
      } else {
        return service.local_db;
      }
    }).catch (function (err) {
  		if (err.message.localeCompare('missing') === 0) {
  			var configDocuments = JSON.parse(fs.readFileSync('pmc_data_configuration.json', 'utf8')).properties;
  			return Promise.all(configDocuments.map(function (document) {
  			    return local_db.put(document);
  			 })).then(function (values) {
  				return service.local_db;
  			}).catch(function(err){
  				console.log(err);
  			});
  		}
    });

  function updateConfig(configDocuments) {

    return Promise.all(configDocuments.map(function (document) {
        return local_db.put(document);
     })).then(function (values) {
      return service.local_db;
    }).catch(function(err){
      console.log(err);
    });
  }

  service.getPatientsDatabase = local_db.get('_design/indexByPatient').then(function (data) {
    if (service.update) {
      console.log("here");
      var indexes = [
        {
          _id: '_design/indexByPatient',
          views: {'indexByPatient':indexByPatient}
        },
        {
          _id: '_design/indexStages',
          views: {'indexStages':indexStages}
        },
        {
          _id: '_design/indexByAccess',
          views: {'indexByAccess':indexByAccess}
        },
        {
          _id: '_design/indexByConsecutive',
          views: {'indexByConsecutive':indexByConsecutive}
        }
      ];
      return Promise.all(indexes.map(function(index){
        console.log(index)
        return local_db.get(index._id).then( function (ind) {

          ind.views = index.views;
          return local_db.put(ind);
        });
      })).then(function (result) {
        return service.local_db;
      });
    } else {
      return service.local_db;
    }
  }).catch (function (err) {
    if (err.message.localeCompare('missing') === 0) {
      var indexes = [
        {
          _id: '_design/indexByPatient',
          views: {'indexByPatient':indexByPatient}
        },
        {
          _id: '_design/indexStages',
          views: {'indexStages':indexStages}
        },
        {
          _id: '_design/indexByAccess',
          views: {'indexByAccess':indexByAccess}
        },
        {
          _id: '_design/indexByConsecutive',
          views: {'indexByConsecutive':indexByConsecutive}
        }
      ];
      return Promise.all(indexes.map(function(index){
        return local_db.put(index);
      }));
    }
  }).then(function (result) {
    return service.local_db;
    // handle result
  }).catch(function (err) {
    console.log(err);
  });

  function connectRemote (remoteURL) {
    service.db_remote = pouchDB( remoteURL , {skipSetup: true});
    return service.db_remote.info();
    //TODO: Connect all databases (or put all data in one) and sync
  }

  function disconnectRemote () {
    if (service.syncHandler) {
        service.syncHandler.on('complete', function (info) {
          // replication was canceled!
          service.db_remote = null;
        });
        service.syncHandler.cancel();
    } else {
      service.db_remote = null;
    }
  }

  function syncDatabase() {
    if (service.db_remote) {
      service.syncHandler = service.local_db.sync(service.db_remote, {
          live: true,
          retry: true
        }).on('change', function (change) {
          // yo, something changed!
          console.log(change);
        }).on('paused', function (info) {
          // replication was paused, usually because of a lost connection
          console.log(info);
        }).on('active', function (info) {
          // replication was resumed
          console.log(info);
        }).on('error', function (err) {
          // totally unhandled error (shouldn't happen)
          console.log(err);
        });
    }

  }

	return service;
  }]);
