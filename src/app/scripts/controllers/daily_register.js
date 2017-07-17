'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:StagePanelCtrl
 * @description
 * # StagePanelCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('DailyRegister', [ '$scope', '$filter', 'patientService',  function ($scope, $filter, patientService) {

    $scope.simulateQuery = true;
    $scope.closeSuccess = closeSuccess;
    $scope.closeError = closeError;
    $scope.querySearch   = querySearch;
    $scope.selectedItemChange = selectedItemChange;
    $scope.patientsSelectedRemove = patientsSelectedRemove;
    $scope.saveAttentions = saveAttentions;
    $scope.patientsSelected = [];
    $scope.title = "DailyRegs.Title";

    function closeSuccess () {
      $scope.saveSuccess = null;
    }

    function closeError () {
      $scope.saveError = null;
    }

    function querySearch (query) {
      return patientService.getPatientHistories(query).then(function(res){
        return res;
      }).catch(function (err) {
        return []
      });
    }

    function selectedItemChange(item) {
      if(item)
      {
        //check if item is already selected
        if(!$filter('filter')($scope.patientsSelected, function (d) {return d.key === item.key;})[0])
        {
          $scope.patientsSelected.push(item);
        }
        // clear search field
        $scope.searchText = '';
        $scope.selectedItem = undefined;

        //blur the autocomplete focus
        document.getElementById("patientAC").blur();
      }
    }

    function patientsSelectedRemove(item) {
      var index = $scope.patientsSelected.indexOf(item);
      $scope.patientsSelected.splice(index, 1);
    }

    function saveAttentions () {
      if ($scope.attentionDate) {
        var attDate = moment($scope.attentionDate).format('DD/MM/YYYY');
        Promise.all($scope.patientsSelected.map( function( patient ) {
          return patientService.registerPatientAttention( patient.id,attDate);
        })).then( function (results) {
          $scope.patientsSelected = [];
          $scope.saveSuccess = {
            title: "DailyRegs.Success.Title",
            message: "DailyRegs.Success.Mssg"
          };
          $scope.$apply();
        }).catch(function (err){
          $scope.saveError = {
            title: "DailyRegs.Error.Title",
            message: "DailyRegs.Error.Mssg"
          };
          console.log(err);
        })
      }
    }

  }]);
