'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:PatientSearchCtrl
 * @description
 * # PatientSearchCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('PatientSearchCtrl', ['$mdEditDialog', '$q', '$scope', '$timeout', '$translate', '$mdDialog', '$mdMedia', '$location' ,'patientService', 'systemConfigService', function ($mdEditDialog, $q, $scope, $timeout, $translate, $mdDialog,  $mdMedia, $location, patientService, systemConfigService) {
  'use strict';

  //Used to save the pagination in case of filter
  var bookmark;
  //Errors for table update
  var errors= {};

  var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'))  &&   $scope.customFullscreen;

  systemConfigService.getSexTypes().then(function(sexTypes) {
    $scope.sexTypes = sexTypes;
  }).catch (function (err){
    console.log(err);
  });

  $scope.title = 'PatientSearch.Title';
  $scope.modified = {};
  $scope.showModified = false;
  $scope.modifiedQty = 0;

  //Translations needed for pagination and dialogs
  Promise.all([$translate('PatientSearch.Pagination.Page'),
              $translate('PatientSearch.Pagination.RowsPerPage'),
              $translate('PatientSearch.Pagination.Of'),
              $translate('PatientSearch.Errors.Date'),
              $translate('PatientSearch.Errors.Number')]).then(function(values) {
    $scope.paginationLabels = "{page: '"+values[0]+":', rowsPerPage: '"+values[1]+":', of: '"+values[2]+":'}";
    errors.date = values[3];
    errors.number = values[4];

  }).catch(function (error) {
    console.log(error);
  });

  $scope.promise = patientService.getPatients();
  $scope.promise.then(function (rows) {
    $scope.patients = rows;
  }).catch(function (err) {
    console.log(err);
  });

  $scope.criteriaMatch = function( criteria ) {
      return function( item ) {
        return item.name === criteria.name;
      };
    };

  $scope.selected = [];
  $scope.limitOptions = [5, 10, 15];

  $scope.options = {
    rowSelection: true,
    multiSelect: true,
    autoSelect: true,
    decapitate: false,
    largeEditDialog: false,
    boundaryLinks: false,
    limitSelect: true,
    pageSelect: true
  };

  $scope.removeFilter = function () {
    $scope.filter.show = false;
    $scope.query.filter = '';

    if($scope.filter.form.$dirty) {
      $scope.filter.form.$setPristine();
    }
  };

  $scope.query = {
    filter: '',
    order: 'doc.SocialRegistry',
    limit: 5,
    page: 1
  };

  $scope.filter = {
    options: {
      debounce: 500
    }
  };

  $scope.editPatient = function (event, patient, type, value) {
    if (event)
      event.stopPropagation(); // in case autoselect is enabled

    if (type == "TEXT" || type == "DATE" || type == "NUMBER" ) {
      var editDialog = {
        modelValue: patient.doc[value],
        focusOnOpen:false,
        messages:errors,
        placeholder: 'Add a comment',
        save: function (input) {
          patient.doc[value] = input.$modelValue;
          $scope.modified[patient.id] = patient;
          $scope.modifiedQty = Object.keys($scope.modified).length;
          $scope.showModified = true;
          console.log($scope.modified);
        },
        targetEvent: event,
        title: 'Add a comment',
        validators: {
          'md-maxlength': 50
        }
      };

      var promise;
      promise = $mdEditDialog.small(editDialog);
      if (type == "TEXT") {
        promise.then(function (ctrl) {
          var input = ctrl.getInput();
        });
      } else if (type == "DATE"){
        promise.then(function (ctrl) {
          var input = ctrl.getInput();

          input.$viewChangeListeners.push(function () {
            var re =/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;
            input.$setValidity('date', re.test(input.$modelValue));
          });
        });
      } else if (type == "NUMBER"){
        promise.then(function (ctrl) {
          var input = ctrl.getInput();

          input.$viewChangeListeners.push(function () {
            var re =  /^\d+$/;
            input.$setValidity('number', re.test(input.$modelValue));
          });
        });
      }
    } else {
      $scope.modified[patient.id] = patient;
      $scope.modifiedQty = Object.keys($scope.modified).length;
      $scope.showModified = true;
      console.log($scope.modified);
    }
  };

  $scope.toggleLimitOptions = function () {
    $scope.limitOptions = $scope.limitOptions ? undefined : [5, 10, 15];
  };

  $scope.loadStuff = function () {
    $scope.promise = patientService.getPatients();
    $scope.promise.then(function (rows) {
      console.log(rows);
      $scope.patients = rows;
    }).catch(function (err) {
      console.log(err);
    });
  }

  $scope.logItem = function (item) {
    console.log(item.name, 'was selected');
  };

  $scope.logOrder = function (order) {
    //In order to do this in backend more support of database is needed
    console.log('order: ', order);
  };

  $scope.logPagination = function (page, limit) {
    console.log('page: ', page);
    console.log('limit: ', limit);
  }

  $scope.$watch('query.filter', function (newValue, oldValue) {
    if(!oldValue) {
      bookmark = $scope.query.page;
    }

    if(newValue !== oldValue) {
      $scope.query.page = 1;
    }

    if(!newValue) {
      $scope.query.page = bookmark;
    }

    //Paginated filtering should be done here
  });

  $scope.delete = function (event) {
    $mdDialog.show({
      controller: "AlertDialogCtrl",
      templateUrl: 'views/alert_dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      locals : {labels :
                 {title : 'PatientSearch.Dialog.DeleteDialog.Title',
                  content: 'PatientSearch.Dialog.DeleteDialog.Content',
                  acceptText: 'PatientSearch.Dialog.OK',
                  cancelText: 'PatientSearch.Dialog.Cancel'} }
    })
    .then(function(accept) {
      Promise.all($scope.selected.map(function (patient) {
        return patientService.deletePatient(patient.id);
      })).then (function (results) {
        if (results.some(function (val) { return angular.isUndefined(val) || val === null  })) {
          showAlert('PatientSearch.Dialog.DeletedErrorDialog.Title', 'PatientSearch.Dialog.DeletedErrorDialog.Content', 'PatientSearch.Dialog.OK');
        } else {
          showAlert('PatientSearch.Dialog.DeletedDialog.Title', 'PatientSearch.Dialog.DeletedDialog.Content','PatientSearch.Dialog.OK');
          $scope.selected = [];
          $scope.loadStuff();
        }
        console.log(results);
      }).catch (function (err) {
        console.log(err)
        showAlert('PatientSearch.Dialog.DeletedErrorDialog.Title', 'PatientSearch.Dialog.DeletedErrorDialog.Content', 'PatientSearch.Dialog.OK');
      })
      console.log($scope.selected)
    }, function() {
      //Dialog cancelled
    });
  };

  function showAlert(title, content, close) {
    $mdDialog.show({
      controller: "AlertDialogCtrl",
      templateUrl: 'views/alert_dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      locals : {labels :
                 {title : title,
                  content: content,
                  acceptText: close} }
    })
    .then(function(accept) {

    }, function() {
      //Dialog cancelled
    });
  }

  $scope.save = function (event) {
    $mdDialog.show({
      controller: "AlertDialogCtrl",
      templateUrl: 'views/alert_dialog.html',
      parent: angular.element(document.body),
      clickOutsideToClose:true,
      fullscreen: useFullScreen,
      locals : {labels :
                 {title : 'PatientSearch.Dialog.SaveDialog.Title',
                  content: 'PatientSearch.Dialog.SaveDialog.Content',
                  acceptText: 'PatientSearch.Dialog.OK',
                  cancelText:'PatientSearch.Dialog.Cancel'} }
    })
    .then(function(accept) {
      $scope.modified = {};
      $scope.showModified = false;
      $scope.modifiedQty = 0;
      console.log($scope.modified);
      //TODO: Implement save
    }, function() {
      //Dialog cancelled
    });
  };

  $scope.cancelSave = function () {
    $scope.modified = {};
    $scope.showModified = false;
    $scope.modifiedQty = 0;
  };

  $scope.viewPatient = function (event, patient) {
    //BirthDate needs to be escaped
    $location.path( "/patient_detail/"+patient.id);
  };

}]);
