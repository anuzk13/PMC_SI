'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:SidenavControllerCtrl
 * @description
 * # SidenavControllerCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('SidenavCtrl', ['$scope', '$mdSidenav', '$location', 'pmcUnitService', function ($scope, $mdSidenav, $location, pmcUnitService) {

  $scope.hospital = "";

  pmcUnitService.getPMCUnit().then(function (pmcUnit) {
    if (pmcUnit) {
      $scope.hospital = pmcUnit.Name;
    }
  }).catch(function (error){
    console.log(error);
  })

  $scope.navbartemplate = {
		name:"navbar template",
		url:"views/sidebar.html"
	};
	$scope.sidenav_close = function () {
    $mdSidenav('left').close();
  };

  $scope.goDailyRegs = function () {
    $location.path( "/daily_register" );
  };

  $scope.goRegister = function () {
    $location.path( "/patient_register" );
  };

  $scope.goSearch = function () {
    $location.path( "/patient_search");
  };

  $scope.goStagesControl = function () {
    $location.path( "/");
  };

  $scope.goImport = function () {
    $location.path( "/data_import");
  };

  $scope.goVisualizations = function () {
    $location.path( "/indicators_visualization");
  };

  $scope.goPMCOverview = function () {
    $location.path("/pmc_unit_detail");
  }

  $scope.goConfiguration =  function () {
    $location.path("/program_settings");
  }

  $scope.goIndicatorsConfig = function () {
    $location.path("/indicators_config");
  }

}]);
