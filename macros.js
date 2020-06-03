function sortTeams() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange(teamOneNamesRange.strRow+":"+teamOneNamesRange.stpRow).sort({column: 2, ascending: true});
  addAMatchSheet.getRange(teamTwoNamesRange.strRow+":"+teamTwoNamesRange.stpRow).sort({column: 2, ascending: true});
};

function sortPlayers() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('2:28').sort({column: 3, ascending: false});
};