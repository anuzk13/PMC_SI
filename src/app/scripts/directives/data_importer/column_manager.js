angular.module('pmcDataCollectorApp')
  .directive("siColumnManager", ['$timeout', '$parse', '$rootScope', 'patientService', function ($timeout, $parse, $rootScope, patientService) {

    var supports = {
        xls: !!(window.XLSX && XLSX.utils),
        csv: !!(window.Papa && Papa.parse)
    };

    return {
        restrict: 'E',
        scope: {
            id: '@?siId',
            callback: '&?siChange',
            columns: '=?siColumns',
            sampleSize: '=?siSampleSize',
            excludeUnknownColumns: '=?siExcludeUnknownColumns',
            allowRenaming: '=?siAllowRenaming',
            uniqueMaxLenght: '=?uniqueMaxLenght',
            // TODO: add support for these flags
            unknownColumnsGroupName: '=?siUnknownColumnsGroupName',
            groupUnknownColumns: '=?siGroupUnknownColumns'
        },
        controller: ['$scope', '$element', '$attrs','$translate', 'systemConfigService', controller],
        controllerAs: 'vm',
        templateUrl: 'views/data_importer/column_manager.html',
        link: link
    };

    function controller($scope, $element, $attrs, $translate, systemConfigService) {

        _.defaults($scope, {
            id: "",
            columns: [],
            sampleSize: 3,
            excludeUnknownColumns: true,
            allowCustomRenaming: false,
            unknownColumnGroupName: '$extras',
            groupUnknownColumns: false,
            callback: angular.noop,
            uniqueMaxLenght:8
        });

        $translate(['ImportData.KeepCol','ImportData.IgnoreColumn' ]).then(function (translations) {
            $scope.keepCol = translations['ImportData.KeepCol'];
            $scope.ignoreCol = translations['ImportData.IgnoreColumn'];
          });

        var self = this;
        var columnMap = $scope.columns.reduce(function (map, entry) {
            var val;
            if (angular.isString(entry)) {
                val = {
                    title: entry,
                    property: entry
                };
            } else {
                val = entry;
            }

            map[String(val.property).trim().toLowerCase()] = val;
            map[String(val.title).trim().toLowerCase()] = val;
            if (angular.isArray(entry.aliases)) {
                entry.aliases.forEach(function (alias) {
                    map[String(alias).trim().toLowerCase()] = val;
                });
            }
            return map;
        }, {});

        var presult;
        var $file;
        $scope.$watch('hasHeader', function () {
            if ($file && self.active) {
                parseFile($file);
            }
        });

        this.remap = function (mapping) {

            remap(mapping);
            //this.active = false;
            //$element.removeClass('active');
        };

        this.cancel = function () {
            this.active = false;
            $element.removeClass('active');
            $scope.selectedSheet = false;
            $scope.selectSheets = [];
            $scope.sheetId = null;
            self.workbook = null;
            self.content = null;
            $scope.preview = null;
        };

        $scope.selectedSheet = false;

        $scope.showMapping = function (column, element) {
          if (!column.showMapping) {
            column.showMapping = true;
          }
        }

        $scope.updateMapping = function (column, oldProp) {
          var obj= angular.fromJson(column.mapping);
          column.mapping = obj;

          if(column.mapping.property != '$skip$') {
            column.prop =  column.mapping.property;
            $scope.takenProperties[column.mapping.property] = "";
          }

          for (var key in column.uniqueValues) {
            column.uniqueValues[key] = "";
          }

          delete $scope.takenProperties[oldProp];
        }

        function isHeader(values) {

            //TODO: Modify to chack for headers in column groups
            return $scope.hasHeader;
        }

        function isExcel(data) {
            return [0xD0, 0x09, 0x3C, 0x50].indexOf(data.charCodeAt(0)) !== -1;
        }

        function parseFile(file) {
            if (!file) {
                return;
            }

            var reader = new FileReader();

            if (reader.readAsBinaryString) {

                reader.onload = function (e) {
                    preparse(file, e.target.result);
                };

                reader.readAsBinaryString(file);
            } else {

                reader.onload = function (e) {

                    /* convert data to binary string */
                    var data = new Uint8Array(e.target.result);
                    var buffer = [];
                    var i;
                    for (i = 0; i < data.length; i++) {
                        buffer[i] = String.fromCharCode(data[i]);
                    }
                    preparse(file, buffer.join(''));
                };
                reader.readAsArrayBuffer(file)
            }
        }

        function preparse(file, content) {
            $scope.takenProperties= {};
            if (supports.xls && isExcel(content)) {
                preparseExcel(content);
            } else if (supports.csv) {
                preparseCSV(file);
            }
        }

        $scope.selectSheet= function() {
          $scope.loading = true;
          $scope.selectedSheet = true;
          var sheet = self.workbook.Sheets[$scope.sheetId];

          if (Object.keys(sheet).length) {
            var headerRange = XLSX.utils.decode_range(sheet['!ref']);
            var firstRow = [];
            var r = headerRange.s.r;
            for (c = headerRange.s.c; c <= headerRange.e.c; c++) {
                var cell = sheet[XLSX.utils.encode_cell({r: r, c: c})];
                if (cell && (cell.w||cell.v)) {
                  firstRow.push(String(cell.w||cell.v));
                } else {
                  firstRow.push("Col");
                }
            }

            var headers;
            var i = 1;
            if (!isHeader(firstRow)) {
                headers = [];
                firstRow.forEach ( function (col) {
                    headers.push('Col ' + i++);
                });
            }

            var data = XLSX.utils.sheet_to_json(sheet, {
                header: headers,
                range: 0
            }).slice(0, 3);

            var uniqueValues = {};
            var headRef = headers || firstRow;
            var initialVal = headerRange.s.c;
            for (c = headerRange.s.c; c  <= headerRange.e.c; c++) {
              //Head range doesn´t start at 0 for rule (example first row of sheet is empty)
              var headIndex = c - initialVal;
              uniqueValues[headRef[headIndex]] = {};
              var rowStart = !isHeader(firstRow) ? headerRange.s.r : ( headerRange.s.r < headerRange.e.r ? headerRange.s.r + 1 : headerRange.e.r )
              for (r = rowStart; r <= headerRange.e.r; r++) {
                  var cell = sheet[XLSX.utils.encode_cell({r: r, c: c})];
                  if (cell && (cell.w||cell.v)) {
                    var cellVal = String(cell.w||cell.v).toLowerCase().trim();
                    uniqueValues[headRef[headIndex]][cellVal] = "";
                    var size = Object.keys(uniqueValues[headRef[headIndex]]).length;
                    if (size > $scope.uniqueMaxLenght) {
                      delete uniqueValues[headRef[headIndex]];
                      break;
                    }
                  }
              }
            };
            preview({
                type: 'excel',
                raw: self.content,
                data: data,
                headers: headers || firstRow,
                uniqueValues: uniqueValues
            });


          } else {

            $scope.callback({data: {
                error: {
                  content:"ImportData.ImportReport.Warnings.EmptySheet",
                  title:"ImportData.ImportReport.Warnings.Title",
                  accept:"ImportData.ImportReport.Warnings.Accept"
                }
            }});
            self.active = false;
            $element.removeClass('active');
          }

          $scope.loading = false;
        }

        function preparseExcel(content) {
            var c;
            self.content = content;
            self.workbook = XLSX.read(content, {
                type: 'binary',
                cellHTML: false,
                cellFormula: false
            });
            $scope.selectSheets = Object.keys(self.workbook.Sheets);
            $scope.$apply();
            console.log($scope.selectSheets)
        }

        function finishPreparse(file, headers, uniqueValues, excludeHead) {

            var previewData = [];
            var rowCount = 0;
            Papa.parse(file, {
                header: false,
                step: function(results, parser) {
                  if (results && results.data[0]) {
                    rowCount++;
                    if (!excludeHead || rowCount > 1) {
                      results.data[0].forEach( function (columnValue, i) {
                        var header = headers[i];
                        if (uniqueValues[header]) {
                          uniqueValues[header][columnValue] = "";
                          var size = Object.keys(uniqueValues[header]).length;
                          if (size > $scope.uniqueMaxLenght) {
                            delete uniqueValues[header];
                          }
                        }
                      });
                      if (rowCount <= $scope.sampleSize) {
                        var obj = {};
                        results.data[0].forEach( function (columnValue, i) {
                          var header = headers[i];
                          obj[header] = columnValue;
                        });
                        previewData.push(obj);
                      }
                    }
                  }
                },
                complete: function (result) {
                  preview({
                      type: 'csv',
                      data: previewData,
                      raw: file,
                      headers: headers,
                      uniqueValues:uniqueValues
                  });
                }
              });
        }

        function preparseCSV(file) {
            Papa.parse(file, {
                preview: 1,
                complete: function (result) {
                    var firstRow = result.data[0];
                    var headers = [];
                    var uniqueValues = {};
                    if (firstRow && isHeader(firstRow)) {
                        headers = firstRow.map(function (column) {
                            uniqueValues[column]= {};
                            return column;
                        });
                        finishPreparse(file, headers, uniqueValues, true);
                    } else {
                        headers = firstRow.map(function (column, i) {
                            var header = 'Column ' + (i + 1);
                            uniqueValues[header] = {};
                            return header;
                        });
                        finishPreparse(file, headers, uniqueValues, false);
                    }
                }
            });
        }

        function parseCsv(file, headers) {

            Papa.parse(file, {
                header: false,
                complete: function (result) {

                    var firstRow = result.data[0];
                    if (isHeader(firstRow)) {
                        result.data.splice(0, 1);
                    }
                    var data = result.data.map(function (columns) {

                        var obj = {};
                        columns.forEach(function (column, i) {

                            if (headers[i] !== '$skip$') {
                                obj[headers[i]] = column;
                            }
                        });
                        return obj;
                    });

                }
            });
        }

        function preview(result) {

            $timeout(function () {

                var preview = $scope.preview = [];

                $scope.ignoreOption = {
                  title: $scope.ignoreCol,
                  property: '$skip$'
                }

                result.headers.forEach(function (header) {

                    var mapping = $scope.ignoreOption;
                    var uniqueValues = result.uniqueValues[header];
                    $scope.columns.forEach( function (importCol) {
                      importCol.columns.forEach(function (col) {
                        if (header.trim().toLowerCase() === String(col.headTranslation).trim().toLowerCase() )
                        {
                          mapping = col;
                          $scope.takenProperties[col.property] = "";
                          if (col.uniqueValues) {
                            col.uniqueValues.forEach (function (uniqueVal) {
                              var trimmed = (uniqueVal.translation).trim().toLowerCase();
                              if (uniqueValues && !angular.isUndefined(uniqueValues[trimmed])) {
                                uniqueValues[trimmed] = uniqueVal;
                              }
                            })
                          }
                        } else {
                          mapping
                        }
                      })
                    });

                    preview.push({
                        header: header,
                        mapping: mapping,
                        custom: header,
                        uniqueValues:uniqueValues,
                        sample: result.data.map(function (v) {
                            return v[header];
                        })
                    });
                });

                presult = result;
            });
        }

        function checkRequiredColsHaveMapping () {
          var ret = true;
          $scope.columns.forEach (function (col) {
            col.columns.forEach (function (titleCol) {
              if (titleCol.required  === 'true') {
                if (!$scope.takenProperties.hasOwnProperty(titleCol.property)) {
                  ret = false;
                }
              }
            })
          });

          return ret;
        }

        function remap(mapping) {
          var mappingComplete = checkRequiredColsHaveMapping ();
          if (mappingComplete) {
            var mappingResult = {}
            var mappings = mapping.map(function (column, index) {
              if (column.mapping.property != '$skip$'){
                mappingResult[index] =  column.mapping;
                mappingResult[index].mappedUnique = column.uniqueValues;
              }
            });
            if (presult.type === 'csv') {
                parseCsv(presult.raw, mappingResult);
            } else {
                createPatientsFromExcel(presult.raw, mappingResult);
            }
          } else {
            $scope.callback({data: {
                error: {
                  content:"ImportData.ImportReport.Warnings.MissingRequired",
                  title:"ImportData.ImportReport.Warnings.Title",
                  accept:"ImportData.ImportReport.Warnings.Accept"
                }
            }});
          }
        }

        function createPatientsFromExcel (content, mappings) {
          var createPatientPromises = [];
          var workbook = XLSX.read(content, {
              type: 'binary',
              cellHTML: false,
              cellFormula: false,
              cellNF: true
          });
          var sheet = workbook.Sheets[workbook.SheetNames[0]];
          var headerRange = XLSX.utils.decode_range(sheet['!ref']);

          var rowStart = !$scope.hasHeader ? headerRange.s.r : ( headerRange.s.r < headerRange.e.r ? headerRange.s.r + 1 : headerRange.e.r );
          var errorLog = {};
          var rowFail = 0;
          for (r = rowStart; r <= headerRange.e.r; r++) {
            var patientObject = {};
            var missingProperties = [];
            var requiredComplete = true;
            var rowComplete = "#" + XLSX.utils.encode_row(r);

            for (colIndex in mappings){

              var cell = sheet[XLSX.utils.encode_cell({r: r, c: colIndex})];
              var mapping = mappings[colIndex];
              var result = null;
              var value = null;
              if (cell && (cell.w||cell.v)) {
                value = cell.w||cell.v;
                if (mapping.type == 'SELECT') {
                  result = checkMappingUnique (value, mapping, errorLog);
                } else if (mapping.type == 'NUMBER') {
                  result = checkNumberCell (value, mapping, errorLog, rowComplete );
                } else if (mapping.type == 'DATE') {
                  if (cell.z.indexOf("/") > -1) {
                      result =  checkDateCell (value, mapping, errorLog, cell.z, rowComplete);
                  } else {
                    result =  checkDateCell (value, mapping, errorLog, rowComplete);
                  }
                } else {
                  result = value.trim();
                }
              }
              if (!isUndefinedOrNull(result)) {
                index(patientObject,mapping.property,result)
              } else if (mapping.required  === 'true') {
                missingProperties.push([mapping, value]);
                requiredComplete = false;
              }
            }
            if (requiredComplete) {
              createPatientPromises.push(createPatient(patientObject));
            } else {
              if (Object.keys(patientObject).length > 0) {
                rowFail++;
                missingProperties.forEach ( function (pair) {
                  var prop = pair[0];
                  var value = pair[1];
                  createErrorLog (errorLog, prop.title, 'ImportData.ImportReport.RowErrors.MissingRequired', [prop.typeLabel || "", prop.format], rowComplete, value)
                } )
              }
            }
          }
          var rowSuccess = 0;
          $scope.saving = true;
          Promise.all(createPatientPromises).then(function (creationResults){
            creationResults.forEach( function (creationResult) {
              if (creationResult) {
                rowSuccess++;
              } else {
                rowFail++;
              }
            });
            $scope.saving = false;
            self.active = false;
            $element.removeClass('active');
            $scope.callback({data: {
                type: 'excel',
                errorLog : errorLog,
                rowSuccess : rowSuccess,
                rowFail:rowFail
            }});
          })
        }

        function createPatientsFromCsv (rawExcel, mappings) {
          //TODO
        }

        function createPatient (patientObject) {
          return patientService.createImportPatientObject(patientObject.PATIENT, $scope.importAsComplete).then( function (importObject) {
            return importObject;
          }).then( function (importObject) {
            return patientService.savePatientImport (importObject._id , importObject.patientObject , $scope.replaceOriginal ).then( function (result) {
              return true;
            }).catch( function (err) {
              return false;
            });
          }).catch( function (err) {
            console.log(patientObject.PATIENT);
          });

        }

        function checkMappingUnique (value, mapping, errorLog) {
          var result = null;
          var mappedUnique = mapping.mappedUnique;
          var mappedValue =  mappedUnique ? mappedUnique[value.toLowerCase().trim()] : null;
          if (!isUndefinedOrNull(mappedValue) && !isUndefinedOrNull(mappedValue.value) ) {
            result = mappedValue.value;
          }
          return result;
        }

        function isUndefinedOrNull (val) {
            return angular.isUndefined(val) || val === null
        }

        function checkDateCell (value, mapping, errorLog, format, row) {
          var result = null;
          if (format && moment(value, format.toUpperCase()).isValid()) {
            var date = moment(value, format.toUpperCase());
            result = date.format(mapping.format);
          } else if (moment(value, mapping.format).isValid()) {
            var date = moment(value, mapping.format);
            result = date.format(mapping.format);
          } else {
            createErrorLog (errorLog, mapping.title, 'ImportData.ImportReport.RowErrors.DateFormat', [mapping.typeLabel || "", mapping.format] , row, value );
          }
          return result;
        }

        function checkNumberCell (value, mapping, errorLog, row) {
          var result = null;
          if (!isNaN(parseFloat(value))) {
            var min = parseFloat(mapping.format.split("-")[0]);
            var max = parseFloat(mapping.format.split("-")[1]);
            if (min<=parseFloat(value) && parseFloat(value)<=max) {
              result = parseFloat(value);
            }
            else {
              createErrorLog (errorLog, mapping.title, 'ImportData.ImportReport.RowErrors.NumberQtity', [mapping.typeLabel || "", mapping.format], row, value);
            }
          } else {
            createErrorLog (errorLog, mapping.title, 'ImportData.ImportReport.RowErrors.NumberFormat', [mapping.typeLabel || "", mapping.format] , row, value);
          }
          return result;
        }

        function createErrorLog (errorObj, property, errorKey, errorDetails, row, value) {
          if (!errorObj[errorKey])
            errorObj[errorKey] = {};
          if (!errorObj[errorKey][property])
            errorObj[errorKey][property] = {};
          if (!errorObj[errorKey][property][errorDetails[0]]) {
            errorObj[errorKey][property][errorDetails[0]] = {};
            var arr = [];
            var obj = {};
            obj.row = row;
            obj.value = value;
            arr.push(obj);
            errorObj[errorKey][property][errorDetails[0]].rows= arr;
            errorObj[errorKey][property][errorDetails[0]].errorDetails = errorDetails[1];
          }
          else {
            var obj = {};
            obj.row = row;
            obj.value = value;
            errorObj[errorKey][property][errorDetails[0]].rows.push(obj);
          }
        }

        function index(obj,indexString, value) {
            if (typeof indexString == 'string')
                return index(obj,indexString.split('.'), value);
            else if (indexString.length==1 && value!==undefined)
                return obj[indexString[0]] = value;
            else if (indexString.length==0)
                return obj;
            else {
              if (angular.isUndefined(obj[indexString[0]]))
                obj[indexString[0]] = {}
              return index(obj[indexString[0]],indexString.slice(1), value);
            }
        }

        $rootScope.$on('si.preview', function (e, id, file) {
            if (file && id === $scope.id) {
                $file = file;
                $scope.hasHeader = true;
                $scope.importAsComplete = false;
                $scope.replaceOriginal = false;
                parseFile(file);
                self.active = true;
                $element.addClass('active');
            }
        });
    }

    function link($scope, $element, $attrs, controller) {

    }
}]);
