'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.dataUtilities
 * @description
 * # dataUtilities
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('dataUtilities', [ 'systemConfigService', function (systemConfigService) {

    var service = {
      loadDate:loadDate,
      saveDate:saveDate,
      loadGroupedBools:loadGroupedBools,
      saveGroupedBools:saveGroupedBools
    }

    function loadDate () {

    };

    function saveDate () {

    };

    function loadGroupedBools () {

    };

    function saveGroupedBools () {

    };

    function getUniqueValue ( uniqueValueName ) {

    };

    function getUniqueValueGroup ( uniqueValueGroup ) {

    }

    return service;
    // AngularJS will instantiate a singleton by calling "new" on this function
  }]);
