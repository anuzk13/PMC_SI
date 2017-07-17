'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.userService
 * @description
 * # userService
 * Factory in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .factory('userService', [ 'systemConfigService', function (systemConfigService) {

    var service = {
      getSession:getSession,
      closeSession:closeSession,
      setSession:setSession,
      setLocalSession:setLocalSession
    }

    return service;

    function getSession (){
      return service.user;
    };

    function closeSession () {
      service.user = null;
    };

    function setSession (user) {
      service.user = user;
    };

    function setLocalSession () {
      var localUser = {
        ID:"local",
        Username:"local",
        roles:["local"]
      }
      service.user = localUser;
    }

  }]);
