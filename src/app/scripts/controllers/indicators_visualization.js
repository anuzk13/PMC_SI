'use strict';

/**
 * @ngdoc function
 * @name pmcDataCollectorApp.controller:IndicatorsVisualizationCtrl
 * @description
 * # IndicatorsVisualizationCtrl
 * Controller of the pmcDataCollectorApp
 */
angular.module('pmcDataCollectorApp')
  .controller('IndicatorsVisualizationCtrl',[ '$scope', '$translate', 'indicatorsService', 'dataExportService', function ($scope, $translate, indicatorsService, dataExportService) {

        $scope.selectedItem;
        $scope.title = "IndicatorVisualization.Title"
        indicatorsService.getIndexesNames().then( function (indexesNames) {
          $scope.indexesNames = indexesNames;
        })
        $scope.showAnual = false;

        $scope.$watch( 'selectedItem', function (newVal, oldVal) {
          if ( !angular.isUndefined(newVal) ) {
            displaySelectedIndicator($scope.selectedItem, $scope.showAnual );
          }
        })

        $scope.$watch( 'meissenItem', function (newVal, oldVal) {
          if ( !angular.isUndefined(newVal) ) {
            displaySelectedIndicator( $scope.meissenItem , false);
            console.log($scope.meissenItem );
          }
        })

        $scope.$watch( 'showAnual', function (newVal, oldVal) {
          if (!angular.isUndefined(newVal)) {
            displaySelectedIndicator($scope.selectedItem, $scope.showAnual);
          }
        })

        function createIndicatorResult (indicator, annualVal) {
          //drawChart($scope.selectedItem.data);
          var upperPromise = indicator.indexA ? indicatorsService.lookupIndicatorIndex(indicator.indexA, annualVal) : Promise.resolve(indicator.numberA);
          var lowerPromise = indicator.indexB ? indicatorsService.lookupIndicatorIndex(indicator.indexB, annualVal) : Promise.resolve(indicator.numberB);
          var numberIndex = indicator.numberIndex;
          var datesObject = {};
          $scope.upperVal = null;
          $scope.lowerVal = null;
          console.log(upperPromise, indicator.indexB);
          return Promise.all([upperPromise, lowerPromise]).then( function (results) {
            console.log(results);
            var upperResult = results[0];
            var lowerResult = results[1];
            if (upperResult && angular.isNumber(upperResult)) {
              addNummberProperty (datesObject, upperResult, 'upperResult');
            } else if (upperResult && upperResult.rows) {
              upperResult.rows.forEach( function (row) {
                addToDatesObject(datesObject, row, 'upperResult')
              });
            }
            if (lowerResult && angular.isNumber(lowerResult)) {
              addNummberProperty (datesObject, lowerResult, 'lowerResult');
            } else if (lowerResult && lowerResult.rows) {
              lowerResult.rows.forEach( function (row) {
                addToDatesObject(datesObject, row, 'lowerResult')
              });
            }
            var dateResults = [];
            for (var key in datesObject) {
              var dateObj = datesObject[key];
              if (dateObj.lowerResult || dateObj.upperResult) {
                var dateResult = {};
                dateResult["total"] = numberIndex ? null : dateObj.lowerResult || 0;
                dateResult["value"] = dateObj.upperResult || 0;
                dateResult["date"] = key;
                dateResults.push(dateResult);
              }
            }
            dateResults.sort(function (a, b) {
              if (a.date > b.date) {
                return 1;
              }
              if (a.date < b.date) {
                return -1;
              }
              // a must be equal to b
              return 0;
            });

            console.log(numberIndex);

            return dateResults;
          });
        }

        $scope.exportExcel = function () {
          $scope.exporting = true;
          $translate(["IndicatorVisualization.Date","IndicatorVisualization.Value","IndicatorVisualization.Empty"]).then( function (stringsTranslations) {
            var dateString = stringsTranslations["IndicatorVisualization.Date"];
            var valueString = stringsTranslations["IndicatorVisualization.Value"];
            var emprtyIndicatorString = stringsTranslations["IndicatorVisualization.Empty"];
            var promisesArray = [];
            var usedIndicators = [];
            $scope.indicatorMeta.forEach ( function (indicator) {
              var indexOwner = $scope.selectedIndex == 0 ? 'KMC' : 'Meissen' ;
              if (indicator.owner == indexOwner) {
                usedIndicators.push(indicator);
                promisesArray.push(createIndicatorResult(indicator, $scope.showAnual));
              }
            })
            Promise.all(promisesArray).then( function (results) {
              var array = [];
              for (var i = 0; i < results.length; i++) {
                var index =  i*4;
                var indicator = usedIndicators[i];
                var indicatorResults = results[i];
                array[index] = [indicator.nameTranslated].concat(indicatorResults.map(function (result) {
                  return result.date;
                }));
                array[index+1] = [valueString].concat(indicatorResults.map(function (result) {
                  var value;
                  if (result.value && result.total && result.total > 0) {
                    value = ((result.value / result.total).toFixed(2) * 100) + "%";
                  } else if (result.value == 0){
                    value = "0%"
                  } else if (result.value) {
                    value = result.value
                  }
                  return value;
                }));
                array[index+2] = [indicator.indexANameTranslated].concat(indicatorResults.map(function (result) {
                  return result.value || "0";
                }));
                array[index+3] = [indicator.indexBNameTranslated].concat(indicatorResults.map(function (result) {
                  return result.total || "0";
                }));
                if (indicatorResults.length == 0) {
                  array[index+1] = [valueString, emprtyIndicatorString];
                }
              }
              var format = {
                alignment: { wrapText: 1, horizontal: 'left', vertical: 'center', indent: 1},
                boldRow: {
                  font: { color:  { rgb: "FFFFFFFF"}, bold:1 },
                  border : {
                    bottom: {style: 'thick', color: {auto: 1}}
                  },
                  fill: { fgColor: { rgb: "FF008080"}}
                },
                boldRowEach : 4
              }
              dataExportService.exportArray(array, format);
              $scope.exporting = false;
              $scope.$apply();
            });
          })

        }

        function displaySelectedIndicator ( selectedItem, annualVal ) {
            $scope.indicatorPercentage = null;
            $scope.missingData = false;
            d3.select("#timeChart").remove();
            d3.select("#pie").remove();
            $scope.pieDate = "";
            if (selectedItem !== undefined) {
              createIndicatorResult(selectedItem, annualVal).then( function (dateResults) {
                $scope.upperText = $scope.indexesNames[selectedItem.indexA] || selectedItem.numberA;
                $scope.lowerText = $scope.indexesNames[selectedItem.indexB] || selectedItem.numberB;
                $scope.lowerType = selectedItem.numberB ? selectedItem.typeB : "";
                d3.select("#timeChart").remove();
                d3.select("#pie").remove();
                $scope.pieDate = "";
                console.log(dateResults);
                if (dateResults.length) {
                  drawChart(dateResults, selectedItem.numberIndex);
                } else {
                  $scope.missingData = true;
                }
                $scope.$apply();
              })
            }
        }

        function addToDatesObject(datesObject, row, property) {
          var date = row.key[0];
          date += row.key[1] ? ("/" + row.key[1]) : '/12';
          datesObject[date] = datesObject[date] || {};
          datesObject[date][property] = getResultValue(row.value);
        }

        function addNummberProperty (datesObject, number, property) {
          for (var key in datesObject) {
            datesObject[key][property] = number;
          }
        }

        function getResultValue (result) {
          if (result.count) {
            return result.sum / result.count;
          } else if (angular.isNumber(result)) {
            return result;
          }
        }

        $scope.indicatorMeta = indicatorsService.indicators;

        var parseDate = d3.time.format("%Y/%m").parse;

        var margin = {
            top: 50,
            right: 50,
            bottom: 100,
            left: 40
          },
          margin2 = {
            top: 430,
            right: 10,
            bottom: 20,
            left: 40
          },
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom,
          height2 = 500 - margin2.top - margin2.bottom;

        var x = d3.time.scale().range([0, width]),
          x2 = d3.time.scale().range([0, width]),
          y = d3.scale.linear().range([height, 0]).domain([0, 100]),
          y2 = d3.scale.linear().range([height2, 0]).domain([0, 100]);

        var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(d3.time.format("%Y/%m")),
          xAxis2 = d3.svg.axis().scale(x2).orient("bottom").tickFormat(d3.time.format("%Y/%m")),
          yAxis = d3.svg.axis().scale(y).orient("left");

        var brush = d3.svg.brush()
          .x(x2);

        var line = d3.svg.line()
          .interpolate("linear")
          .x(function(d) {
            return x(parseDate(d.date));
          });

        var line2 = d3.svg.line()
          .interpolate("linear")
          .x(function(d) {
            return x2(parseDate(d.date));
          });

        var focus;
        var circlegroup;

        function drawChart(sampleData, numberIndex) {

          $scope.numberIndex = numberIndex;

          var calculateValue = function (data) {
            if (data.total > 0 ) {
              return data.value / data.total;
            } else if (numberIndex){
              return data.value || 0;
            } else {
              return 0;
            }
          }

          line.y(function(d) {
              var val = calculateValue(d);
              return y(val);
            });

          line2.y(function(d) {
              var val = calculateValue(d);;
              return y2(val);
            });

          brush.on("brush",   function () {
            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            circlegroup.selectAll(".dot").attr("cx", function(d) {
              return x(parseDate(d.date));
            }).attr("cy", function(d) {
              var val = calculateValue(d);
              return y(val);
            });

          });

          var svg = d3.select("#timeline").append("svg")
            .attr("id", "timeChart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

          svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

          focus = svg.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

          x.domain(d3.extent(sampleData.map(function(d) {
            return parseDate(d.date);
          })));
          var domArray = sampleData.map(function(d) {
            return calculateValue(d);
          });
          domArray.push(1);
          y.domain([0, d3.max(domArray)]);
          x2.domain(x.domain());
          y2.domain(y.domain());

          xAxis.ticks(domArray.length);
          xAxis2.ticks(domArray.length);
          if (numberIndex) {
            yAxis.tickFormat(d3.format(""))
          } else {
            yAxis.tickFormat(d3.format(".0%"))
          }
          focus.append("path")
            .datum(sampleData)
            .attr("class", "line blue-line")
            .attr("d", line);

          focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

          focus.append("g")
            .attr("class", "y axis")
            .call(yAxis);

          circlegroup = focus.append("g");

          circlegroup.attr("clip-path", "url(#clip)");
          circlegroup.selectAll('.dot')
            .data(sampleData)
            .enter().append("circle")
            .attr('class', 'dot')
            .attr("cx", function(d) {
              return x(parseDate(d.date));
            })
            .attr("cy", function(d) {
              var val = calculateValue(d);
              return y(val);
            })
            .attr("r", function(d) {
              return 4;
            })
            .on('mouseover', function(d, i)  {
              d3.select(this).attr('r', 8)
            })
            .on('mouseout', function(d) {
              d3.select(this).attr('r', 4)
            })
            .on("click", function(d) {
              focusPoint(d);
            });

          context.append("path")
            .datum(sampleData)
            .attr("class", "line  blue-line")
            .attr("d", line2);

          context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

          context.append("g")
            .attr("class", "x brush")
            .call(brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", height2 + 7);
        }



        function focusPoint(data) {
          d3.select("#pie").remove();
          $scope.pieDate = "";
          $scope.upperVal = data.value;
          $scope.lowerVal = data.total;
          $scope.indicatorPercentage = " : " +((data.total > 0 ? data.value / data.total : 0) * 100).toFixed(2) + " %";
          $scope.pieDate = data.date ? data.date : "" ;
          $scope.$apply();
          if (data.total && data.total >= data.value) {
            var pieSample = [{
              value: data.value,
              color: "#009688",
              text: data.value
            }, {
              value: data.total - data.value,
              color: "#CDCDCD",
              text: ''
            }]
            drawPie(pieSample);
          }

        }

        var pieWidth = 250,
          pieHeight = 250,
          pieRadius = Math.min(pieWidth, pieHeight) / 2;

        var arc = d3.svg.arc()
          .outerRadius(pieRadius - 10)
          .innerRadius(0);

        var labelArc = d3.svg.arc()
          .outerRadius(pieRadius - 40)
          .innerRadius(pieRadius - 40);

        var pie = d3.layout.pie()
          .sort(null)
          .value(function(d) {
            return d.value;
          });

        function drawPie(pieSample) {

          var svg = d3.select("#selected").append("svg")
            .attr("id", "pie")
            .attr("width", pieWidth)
            .attr("height", pieHeight)
            .append("g")
            .attr("transform", "translate(" + pieWidth / 2 + "," + pieHeight / 2 + ")");

          var g = svg.selectAll(".arc")
            .data(pie(pieSample))
            .enter().append("g")
            .attr("class", "arc");

          g.append("path")
            .attr("d", arc)
            .style("fill", function(d) {
              return d.data.color;
            });

          g.append("text")
            .attr("transform", function(d) {
              return "translate(" + labelArc.centroid(d) + ")";
            })
            .attr("dy", ".35em")
            .text(function(d) {
              return d.data.text;
            });

        }
  }]);
