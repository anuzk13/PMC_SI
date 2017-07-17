'use strict';

/**
 * @ngdoc overview
 * @name finalProjectApp
 * @description
 * # finalProjectApp
 *
 * Main module of the application.
 */
angular
  .module('pmcDataCollectorApp', [
    'ngRoute',
    'ngMaterial',
    'ngAnimate',
    'ngMessages',
    'ngPassword',
    'ngSanitize',
    'pascalprecht.translate',
    'pouchdb',
    'md.data.table',
    'ui.sortable'
  ])
  .config(['$httpProvider','$routeProvider', '$translateProvider', '$mdThemingProvider', '$mdDateLocaleProvider', 'pouchDBProvider', 'POUCHDB_METHODS', function ($httpProvider, $routeProvider,$translateProvider,$mdThemingProvider, $mdDateLocaleProvider, pouchDBProvider,POUCHDB_METHODS) {
    $routeProvider
      .when('/',{
        controller:'MainDashboardCtrl',
        templateUrl: 'views/main_dashboard.html',
        resolve:{
          pouchData:function(systemConfigService){
            return systemConfigService.initDefaultConfig;
          },
          pouchIndexes:function(indicatorsService){
            return indicatorsService.initIndicatorsIndexes;
          },
          patientDB:function(patientService){
            return patientService.initDatabase;
          }
        },
        controllerAs: 'mainDashboard'
      })
      .when('/pmc_unit_register', {
        templateUrl: 'views/pmc_unit_register.html',
        controller: 'PmcUnitRegisterCtrl',
        controllerAs: 'pmcUnitRegister'
      })
      .when('/main_dashboard', {
        templateUrl: 'views/main_dashboard.html',
        controller: 'MainDashboardCtrl',
        resolve:{
          puchData:function(systemConfigService){
            return systemConfigService.initDefaultConfig;
          },
          pouchIndexes:function(patientService){
            return patientService.initDatabaseIndexes;
          }
        }
      })
      .when('/login', {
        templateUrl: 'views/login.html',
        controller: 'LoginCtrl',
        controllerAs: 'login'
      })
      .when('/patient_register', {
        templateUrl: 'views/patient_register.html',
        controller: 'PatientRegisterCtrl',
        controllerAs: 'PatientRegister'
      })
      .when('/patient_search', {
        templateUrl: 'views/patient_search.html',
        controller: 'PatientSearchCtrl',
        controllerAs: 'patientSearch'
      })
      .when('/patient_detail/:patient_id/:tab', {
        templateUrl: 'views/patient_detail.html',
        controller: 'PatientDetailCtrl',
        controllerAs: 'patientDetail'
      })
      .when('/patient_detail/:patient_id', {
        templateUrl: 'views/patient_detail.html',
        controller: 'PatientDetailCtrl',
        controllerAs: 'patientDetail'
      })
      .when('/data_import', {
        templateUrl: 'views/data_import.html',
        controller: 'DataImportCtrl',
        controllerAs: 'dataImport'
      })
      .when('/indicators_visualization', {
        templateUrl: 'views/indicators_visualization.html',
        controller: 'IndicatorsVisualizationCtrl',
        controllerAs: 'indicatorsVisualization'
      })
      .when('/pmc_unit_detail', {
        templateUrl: 'views/pmc_unit_detail.html',
        controller: 'PmcUnitDetailCtrl',
        controllerAs: 'pmcUnitDetail'
      })
      .when('/patient_events', {
        templateUrl: 'views/patient_events.html',
        controller: 'PatientEventsCtrl',
        controllerAs: 'patientEvents'
      })
      .when('/program_settings', {
        templateUrl: 'views/program_settings.html',
        controller: 'ProgramSettingsCtrl',
        controllerAs: 'programSettings'
      })
      .when('/alert_dialog', {
        templateUrl: 'views/alert_dialog.html',
        controller: 'AlertDialogCtrl',
        controllerAs: 'alertDialog'
      })
      .when('/indicators_config', {
        templateUrl: 'views/indicators_config.html',
        controller: 'IndicatorsConfigCtrl',
        controllerAs: 'indicatorsConfig'
      })
      .when('/daily_register', {
        templateUrl: 'views/daily_register.html',
        controller: 'DailyRegister',
        controllerAs: 'dailyRegister'
      })
      .otherwise({
        redirectTo: '/'
      });

    if ( !localStorage.getItem('DefaultLanguage')) {
      localStorage.setItem('DefaultLanguage', 'es');
    }
    var language_default = localStorage.getItem('DefaultLanguage');
       //Translation service preferecens
    $translateProvider
      .useStaticFilesLoader({
        prefix: './translations/',
        suffix: '.json'
      })
      .preferredLanguage(language_default)
      .useSanitizeValueStrategy('escapeParameters');

    $mdThemingProvider
    .theme('default')
    .primaryPalette('teal')
    .accentPalette('blue')
    .warnPalette('orange');

    $mdThemingProvider
    .theme('dark-grey')
    .primaryPalette('grey')
    .backgroundPalette('grey').dark();

    $mdThemingProvider
    .theme('orange')
    .primaryPalette('orange')
    .backgroundPalette('orange');

    $mdDateLocaleProvider.parseDate = function(dateString) {
      if (moment(dateString, 'DD/MM/YYYY').isValid() && dateString.indexOf("/") > -1) {
        var m = moment(dateString, 'DD/MM/YYYY', true);
      } else if (moment(dateString, 'DD-MM-YYYY').isValid() && dateString.indexOf("-") > -1) {
        var m = moment(dateString, 'DD-MM-YYYY', true);
      }
      return m && m.isValid() ? m.toDate() : new Date(NaN);
    };

    $mdThemingProvider.theme('green').backgroundPalette('green');
    $mdDateLocaleProvider.formatDate = function(date) {
      if (!date) {
        return '';
      }
      // All of the dates created through ng-material *should* be set to midnight.
      // If we encounter a date where the localeTime shows at 11pm instead of midnight,
      // we have run into an issue with DST where we need to increment the hour by one:
      // var d = new Date(1992, 9, 8, 0, 0, 0);
      // d.toLocaleString(); // == "10/7/1992, 11:00:00 PM"
        return moment(date).format('DD/MM/YYYY');

   };

   moment.locale(language_default);
   var count = 0;
    var months = [];
    while (count < 12) {
      var month = moment().month(count++).format("MMMM").toString().trim();
      var monthName = month.charAt(0).toUpperCase() + month.slice(1);
      months.push(monthName);
    }
    $mdDateLocaleProvider.months = months;
    $mdDateLocaleProvider.monthHeaderFormatter = function(date) {
      return months[date.getMonth()] + ' ' + date.getFullYear();
    };
    var days = []
    var day = moment().day("Sunday")
    var count = 0;
    while (count < 7) {
    	var dayString = day.format("dd").toString();
     	day = day.add(1,'day');
    	days.push(dayString);
      count++;
    }
    $mdDateLocaleProvider.shortDays = days;
    var extensionMethods = {
      upsert: 'qify',
      putIfNotExists:'qify',
      login: 'qify',
      logout: 'qify',
      getUser: 'qify'
    };
    pouchDBProvider.methods = angular.extend({}, POUCHDB_METHODS, extensionMethods);

  }])
  .run(['$rootScope', '$location', 'pmcUnitService' , 'userService', 'systemConfigService', 'remoteService', function($rootScope, $location, pmcUnitService, userService, systemConfigService, remoteService){
    systemConfigService.initDefaultConfig.then( function (res) {
     return pmcUnitService.getPMCUnit();
    }).then(function (pmcUnit){
      document.getElementById("initWait").style.display="none"
      if (!pmcUnit) {
        $location.path( "/pmc_unit_register" );
      } else {
        if (!userService.getSession() && !remoteService.keepOffline()) {
          $location.path( "/login" );
        } else if (!userService.getSession() ) {
          userService.setLocalSession();
        }
      }
      $rootScope.$on( "$routeChangeStart", function(event, next, current) {
        if ( next.templateUrl != "views/pmc_unit_register.html" && next.templateUrl != "views/login.html" ) {
          if (!userService.getSession() && !remoteService.keepOffline()) {
            $location.path( "/login" );
          } else if (!userService.getSession() ) {
            userService.setLocalSession();
          }
        }
      });

    }) .catch(function (err) {
     console.log(err)
    })
  }]);
