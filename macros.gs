function sortTeams() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('2:6').activate()
  .sort({column: 2, ascending: true});
  spreadsheet.getRange('9:13').activate()
  .sort({column: 2, ascending: true});
};

function sortPlayers() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('2:26').activate()
  .sort({column: 3, ascending: false});
  spreadsheet.getRange('D3').activate();
};