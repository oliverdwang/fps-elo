function sortTeams() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange('12:16').sort({column: 2, ascending: true});
  addAMatchSheet.getRange('21:25').sort({column: 2, ascending: true});
};

function sortPlayers() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('2:26').activate()
  .sort({column: 3, ascending: false});
  spreadsheet.getRange('D3').activate();
};