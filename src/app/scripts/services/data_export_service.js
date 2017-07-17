'use strict';

/**
 * @ngdoc service
 * @name pmcDataCollectorApp.dataExportService
 * @description
 * # dataExportService
 * Service in the pmcDataCollectorApp.
 */
angular.module('pmcDataCollectorApp')
  .service('dataExportService', ['patientService', 'systemConfigService', '$translate', function (patientService, systemConfigService, $translate) {

    var service = {
      getSupports: getSupports,
      exportData: exportData,
      exportCustom:exportCustom,
      exportArray:exportArray
    }

    return service;

    function getSupports () {
      return {
        xls: !!(window.XLSX && XLSX.utils),
        csv: !!(window.Papa && Papa.parse)
      }
    };

    function exportArray (array, format) {
      var ws_name = "Export";
      var wb = new Workbook(), ws = sheet_from_array_of_arrays(array, format);
      var wscols = [
          {wch:40}
      ];
      ws['!cols'] = wscols;
      /* add worksheet to workbook */
      wb.SheetNames.push(ws_name);
      wb.Sheets[ws_name] = ws;

      var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});
      var today = moment().format("MMM Do YY");
      saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Export" + today+ ".xlsx");
    }

    function exportCustom (year, month) {
      createCustomFirstRow().then (function (rowIndexes) {
        console.log(rowIndexes)
        patientService.getMonthPatientData(year, month).then(function (result) {
          exportWithRow (rowIndexes, result.rows)
        })
      });
    }

    function exportWithRow (rowIndexes, dataRows) {
      var spreadArray = [];
      spreadArray.push(rowIndexes.exportHeaders);
      var patientsObject = {};
      return Promise.all(dataRows.map(function (row) {
        patientsObject[row.id] = patientsObject[row.id] ? patientsObject[row.id] :Array.apply(null, Array(rowIndexes.exportHeaders.length)).map(String.prototype.valueOf,"");
        return patientService.getDataBaseObject(row.id);
      })).then (function (dataRows) {
        var exportRow;
        dataRows.forEach(function (dataRow) {
          if (dataRow.type == "PATIENT") {
            exportRow = patientsObject[dataRow._id]
          } else {
            exportRow = patientsObject[dataRow.Patient_id]
          }
          for (var key in dataRow) {
            if (key != "_id" && key != "_rev" && key != "type"){
              assignRowValue(rowIndexes.translatedObject, dataRow[key], key,  dataRow.type, exportRow)
            }
          }
        });
        for (var key in patientsObject) {
          spreadArray.push(patientsObject[key]);
        }
        var ws_name = "SheetJS";
        var wb = new Workbook(), ws = sheet_from_array_of_arrays(spreadArray);
        /* add worksheet to workbook */
        wb.SheetNames.push(ws_name);
        wb.Sheets[ws_name] = ws;
        var wbout = XLSX.write(wb, {bookType:'xlsx', bookSST:true, type: 'binary'});

        var today = moment().format("MMM Do YY");
        saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), "Export" + today+ ".xlsx");
      });
    }

    function exportData () {
      createFistRow ().then (function (rowIndexes) {
        patientService.getAllPatientData().then(function (dataResults) {
          exportWithRow (rowIndexes,dataResults.rows);
        })
      });
    }

    function sheet_from_array_of_arrays(data, format) {
    	var ws = {};
    	var range = {s: {c:10000000, r:10000000}, e: {c:0, r:0 }};
    	for(var R = 0; R != data.length; ++R) {
    		for(var C = 0; C != data[R].length; ++C) {
    			if(range.s.r > R) range.s.r = R;
    			if(range.s.c > C) range.s.c = C;
    			if(range.e.r < R) range.e.r = R;
    			if(range.e.c < C) range.e.c = C;
    			var cell = {v: data[R][C] };
    			if(cell.v == null) continue;
    			var cell_ref = XLSX.utils.encode_cell({c:C,r:R});

    			if(typeof cell.v === 'number') cell.t = 'n';
    			else if(typeof cell.v === 'boolean') cell.t = 'b';
    			else if(cell.v instanceof Date) {
    				cell.t = 'n'; cell.z = XLSX.SSF._table[14];
    				cell.v = datenum(cell.v);
    			}
    			else cell.t = 's';

          if (format) {
            cell.s = {}
            if (format.alignment) {
              cell.s.alignment= format.alignment;
            }
            if (format.boldRowEach && R % format.boldRowEach == 0) {
              cell.s.border= format.boldRow.border;
              cell.s.fill = format.boldRow.fill;
              cell.s.font = format.boldRow.font;
            }
          }

    			ws[cell_ref] = cell;
    		}
    	}
    	if(range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
    	return ws;
    }

    function Workbook() {
    	if(!(this instanceof Workbook)) return new Workbook();
    	this.SheetNames = [];
    	this.Sheets = {};
    }

    function s2ab(s) {
    	var buf = new ArrayBuffer(s.length);
    	var view = new Uint8Array(buf);
    	for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    	return buf;
    }


    function insertInPos (array, pos, value) {
      array.splice(pos, 1, value);
    }



    function assignRowValue (rowIndexes, element , key, type, exportRow) {
      var value;
      if(element && typeof element === 'object') {
        var keyStrings  = getKeyString(key, element);
        keyStrings.forEach(function (keyString){
          value = rowIndexes[type+"."+keyString];
          var elementKey = keyString.replace(key +"." , "");
          var elementValue = getValue(element, elementKey)
          assignIndividual(exportRow,value, elementValue);
        })
      } else {
          value = rowIndexes[type+"."+key];
          assignIndividual(exportRow,value, element);
      }
    }

    function getKeyString ( name, element ) {
      var result = [];
      for (var sub_key in element) {
        var son = element[sub_key];
        if (typeof son === 'object') {
          var sonResult = getKeyString (sub_key, son )
          sonResult.forEach (function (sonKey) {
            result.push (name + "." + sonKey)
          })
        } else {
          if (sub_key != "_id" && sub_key != "_rev" && sub_key != "type" )
          result.push (name + "." + sub_key)
        }
      }
      return result;
    }

    function assignIndividual (exportRow,value, element) {
      if (value) {
        if (value.uniqueValues) {
          insertInPos(exportRow,value.index, value.uniqueValues[element]);
        } else {
          insertInPos(exportRow,value.index, element);
        }
      }
    }

    function createFistRow ( ) {
      var translatedObject = {};
      var exportHeaders= [];
      return systemConfigService.getImportColumns().then(function (columnTypes) {
        return Promise.all(columnTypes.map(function(colType) {
           return translateColumnExport(colType.columns, translatedObject, exportHeaders);
        })).then(function() {
          var obj = {
            translatedObject : translatedObject,
            exportHeaders : exportHeaders
          };
          return obj;
        });
      })
    }

    function createCustomFirstRow () {
      var translatedObject = {};
      var exportHeaders= [];
      return systemConfigService.getSavedCustomColumns().then(function (savedCustomCols) {
        return translateColumnExport(savedCustomCols.UsedCols, translatedObject, exportHeaders).then(function() {
          var obj = {
            translatedObject : translatedObject,
            exportHeaders : exportHeaders
          };
          return obj;
        });
      })
    }

    function translateColumnExport (columns, translatedObject, exportHeaders) {
      return Promise.all(columns.map(function (column) {
        var labelArr = column.exportLabel ? [column.exportTitle].concat(column.exportLabel) : [column.exportTitle];
        return $translate(labelArr).then(function(translation) {
          var translation = column.exportLabel ? translation[column.exportTitle] + translation[column.exportLabel]  : translation[column.exportTitle];
          translatedObject[column.property] = {index : exportHeaders.length}
          exportHeaders.push(translation);
        }).then(function ( ) {
          if (column.uniqueValues) {
            translatedObject[column.property].uniqueValues = {}
            return translateUniqueValues (column, translatedObject);
          }
        }).catch(function (err){
          console.log(err);
        });
      }));
    }

    function translateUniqueValues (column, translatedObject) {
      return Promise.all(column.uniqueValues.map(function (uniqueVal) {
        return $translate(uniqueVal.nameKey).then(function(translation) {
          translatedObject[column.property].uniqueValues[uniqueVal.value] = translation;
        }).catch(function (err) {
          console.log(err);
        })
      }));
    }

    function getValue (object, stringKey){
      var keys = stringKey.split(".");
      if (keys.length > 1) {
        return getValue (object[keys[0]], stringKey.replace(keys[0] + ".", "") )
      } else {
        return object[stringKey];
      }
    }


    // AngularJS will instantiate a singleton by calling "new" on this function
  }] );
