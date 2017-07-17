'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.growthChartsService
 * @description
 * # growthChartsService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('patientGrowthService', [function () {
    // AngularJS will instantiate a singleton by calling "new" on this function
    var service = {
      calculatePatientGrowth:calculatePatientGrowth,
      getAverageValue:getAverageValue
    }

    //Detects if growth of patient is 2 standards deviantions below the WHO charts for month statistics
    //Uses LMS formula
    function calculatePatientGrowth (chart, value, months) {
      console.log(chart, value, months);
      if (chart == 'wfa_boys_0_1_y_zscores' || chart == 'wfa_girls_0_1_y_zscores') {
        if (value / 500 > 1) {
          value = value/ 1000;
        }
      }
      var fs = require('fs');
      var file = JSON.parse(fs.readFileSync('who_charts_json/'+chart+'.json', 'utf8'));
      var monthStatistics = file.statistics[months];
      var M = monthStatistics.M;
      var S = monthStatistics.S;
      var L = monthStatistics.L;
      return LMSFormula(L,M,S,value);
    }

    //LMS formula to calculate Z score
    function LMSFormula (normalizationPower,mean,variationCoefficient, observerValue) {
      var zscore = (Math.pow((observerValue / mean), normalizationPower) -1) / (normalizationPower * variationCoefficient) ;
      return (zscore > -2);
    }

    function getAverageValue (chart, months) {
      var fs = require('fs');
      var file = JSON.parse(fs.readFileSync('who_charts_json/'+chart+'.json', 'utf8'));
      var monthStatistics = file.statistics[months];
      var M = monthStatistics.M;
      if (chart == 'wfa_boys_0_1_y_zscores' || chart == 'wfa_girls_0_1_y_zscores') {
        M = M * 1000;
      }
      return M;
    }

    return service;
  }]);
