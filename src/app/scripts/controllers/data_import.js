'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:DataImportCtrl
 * @description
 * # DataImportCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('DataImportCtrl', ['$scope', '$translate', '$mdDialog', '$mdMedia', 'systemConfigService', 'dataExportService', function ($scope, $translate, $mdDialog, $mdMedia, systemConfigService, dataExportService) {


      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

      systemConfigService.getImportColumns().then(function (columnTypes) {
        var importHeaders = [];
        Promise.all(columnTypes.map(function(colType) {
           return translateColumnExport(colType);
        })).then(function (results) {
          $scope.columns = columnTypes;
        });

      })

      $scope.title = "ImportData.Title";

      $scope.months = [];
      $scope.years = [];
      for (var i = 0; i < 12; i++) {
        var monthName = (i + 1)<10 ?  '0' + (i+1) : (i+1);
        var monthObj = {
          name : moment().month(i).format("MMMM"),
          value :monthName
        }
        $scope.months.push(monthObj);
      }
      for (var i = 2015; i < 2050; i++) {
        $scope.years.push(i);
      }

      $scope.showSelect = false;

      $scope.showLogs = function(logData) {
        if (logData.error) {
          $mdDialog.show({
            controller: "AlertDialogCtrl",
            templateUrl: 'views/alert_dialog.html',
            parent: angular.element(document.body),
            clickOutsideToClose:true,
            fullscreen: useFullScreen,
            locals : {labels : {title : logData.error.title,
                      content: logData.error.content,
                      acceptText: logData.error.accept} }
          })
          .then(function(accept) {

          }, function() {
            //Dialog cancelled
          });
        } else {
          $scope.importType = logData.type;
          $scope.selectedReport = null;
          $scope.errorLog = isEmpty(logData.errorLog) ? null:logData.errorLog ;
          $scope.rowSuccess = {
             rowNum: logData.rowSuccess
          };
          $scope.rowFail = {
            rowNum: logData.rowFail
          };
          $scope.$apply();
        }

      };

      $scope.importData = function () {
        $scope.showSelect = true;
      }

      $scope.exportData = function () {
        dataExportService.exportData();
      }

      $scope.exportCustomData = function () {
        console.log($scope.exportYear , $scope.exportMonth)
        dataExportService.exportCustom($scope.exportYear , $scope.exportMonth);
      }

      $scope.closeLog = function () {
        $scope.importType = null;
        $scope.errorLog = null;
        $scope.rowSuccess = null;
        $scope.rowFail = null;
        $scope.showSelect = false;
        $scope.selectedReport = null;
      }

      $scope.columns = [];

      $scope.setSelectedReport = function (report) {
          $scope.selectedReport = report;
      };

      function isEmpty(obj) {
          for(var prop in obj) {
              if(obj.hasOwnProperty(prop))
                  return false;
          }
          return true && JSON.stringify(obj) === JSON.stringify({});
      };

      function translateColumnExport (coltype) {
        return Promise.all(coltype.columns.map(function (column) {
          var labelArr = column.exportLabel ? [column.exportTitle].concat(column.exportLabel) : [column.exportTitle];
          return $translate(labelArr).then(function(translation) {
            column.headTranslation = column.exportLabel ? translation[column.exportTitle] + translation[column.exportLabel]  : translation[column.exportTitle];
            return translation;
          }).then(function( translations ) {
            if (column.uniqueValues) {
              return Promise.all(column.uniqueValues.map(function (uniqueVal) {
                return $translate(uniqueVal.nameKey).then(function(translation) {
                  uniqueVal.translation = translation;
                  return translation;
                }).catch(function (err) {
                  console.log(err);
                })
              }));
            }
          }).catch(function (err){
            console.log(err);
          });
        }));
      }
  }]);
