'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:TopbarCtrl
 * @description
 * # TopbarCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('TopbarCtrl', ['$scope',  '$timeout', '$mdSidenav', function ($scope, $timeout, $mdSidenav) {
	$scope.topbartemplate = {
		name:"navbar template",
		url:"views/topbar.html"
	};

	$scope.toggleLeft = buildDelayedToggler('left');

    /**
	 * Build handler to open/close a SideNav; when animation finishes
	 * report completion in console
    */
    function buildDelayedToggler(navID) {
      return debounce(function() {
        $mdSidenav(navID)
          .toggle();
      }, 200);
    };

    /**
     * Supplies a function that will continue to operate until the
     * time is up.
     */
    function debounce(func, wait, context) {
      var timer;

      return function debounced() {
        var context = $scope,
            args = Array.prototype.slice.call(arguments);
        $timeout.cancel(timer);
        timer = $timeout(function() {
          timer = undefined;
          func.apply(context, args);
        }, wait || 10);
      };
    }
  }]);
