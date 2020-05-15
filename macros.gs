function sort1() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('2:6').activate()
  .sort({column: 2, ascending: true});
};