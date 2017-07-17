angular.module('pmcDataCollectorApp')
  .directive("siImporter", ['$rootScope', function ($rootScope) {
    var accepts = [];

      if(!!(window.XLSX && XLSX.utils)) {
          accepts.push('.xls', '.xlsx');
      }

      if(!!(window.Papa && Papa.parse)) {
          accepts.push('.csv', '.tsv', '.txt');
      }

      return {
          restrict: 'E',
          scope: {
              id: '@siId'
          },
          controller: controller,
          controllerAs: 'vm',
          templateUrl: 'views/data_importer/importer.html',
          link: link
      };

      function controller() {

      }

      function link($scope, $element, $attrs) {

          _.defaults($scope, {
              id: ""
          });

          var element = $element[0];
          element.setAttribute('accepts', accepts.join());
          element.querySelector('input[type="file"]').addEventListener('change', function (e) {
            if (e.target.value) {
                $rootScope.$emit('si.preview', $scope.id, e.target.files[0]);
                e.target.value = null;
            }
          });
      }
}]);
