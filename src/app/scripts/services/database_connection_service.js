'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.databaseConnectionService
 * @description
 * # databaseConnectionService
 * Factory in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .factory('databaseConnectionService', function () {
    
    var sqlite3 = require('sqlite3').verbose();
    var db = new sqlite3.Database('PMC_Data.db');

    var service = {
      database:db
    }

    return service;
  });
