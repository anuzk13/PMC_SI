'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.authService
 * @description
 * # authService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('remoteService', ['pouchDbService',  'userService' , function (pouchDbService, userService) {

    var service = {
      authRemote:authRemote,
      logoutRemote:logoutRemote,
      deleteRemoteDatabase:deleteRemoteDatabase,
      getRemoteDatabase:getRemoteDatabase,
      getRemoteConfiguration:getRemoteConfiguration,
      keepOffline:keepOffline,
      registerInRemote:registerInRemote,
      setRemoteDatabase:setRemoteDatabase,
      setKeepOffline:setKeepOffline,
      stopSync:stopSync,
      syncRemote:syncRemote
    }

    function authRemote (username , password, remoteUrl){
      return pouchDbService.connectRemote(remoteUrl).then(function (result) {
        console.log(pouchDbService.db_remote, result)
        return pouchDbService.db_remote.login(username, password).then( function (result) {
          if (result.ok === true) {
            var user = {
              roles : result.roles,
              username : username
            }
            userService.setSession(user);
          }
          return result;
        }).catch( function (err) {
          console.log(err)
          return err;
        })
      }).catch( function (err) {
        return err;
      });

    }

    function logoutRemote () {
      if (pouchDbService.db_remote) {
        return pouchDbService.db_remote.logout().then( function (result) {
          pouchDbService.disconnectRemote();
          return result;
        }).catch(function (err) {
          //TODO: Start to deal with network errors
        })
      }
    }

    function getRemoteConfiguration () {
      return pouchDbService.db_remote.get("data_collector_settings").then( function (doc) {
        return doc;
      }).catch( function (err) {
        if (err.name == "not_found") {
          return null;
        } else {
          console.log(err);
        }
      })
    }

    function getRemoteDatabase() {
      return localStorage.getItem('remote_database');
    }

    function keepOffline () {
      return localStorage.getItem('keep_offline') == '1'; 
    }

    function deleteRemoteDatabase() {
      localStorage.removeItem('remote_database');
    }

    function registerInRemote (username, password, role) {
      pouchDbService.db_remote.signup(username, password).then( function (result) {

      }).catch( function (result) {

      })
    }

    function setRemoteDatabase (remoteURL){
      localStorage.setItem('remote_database', remoteURL);
    }

    function setKeepOffline ( preference ) {
      if (preference) {
        localStorage.setItem('keep_offline', '1');
      } else {
        localStorage.removeItem('keep_offline');
      }

    }

    function stopSync () {
      pouchDbService.disconnectRemote();
    }

    function syncRemote (){
      pouchDbService.syncDatabase();
    }


    return service;
    // AngularJS will instantiate a singleton by calling "new" on this function
  }]);
