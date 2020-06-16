function sortTeams() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange(teamOneNamesRange.strRow+":"+teamOneNamesRange.stpRow).sort({column: 2, ascending: true});
  addAMatchSheet.getRange(teamTwoNamesRange.strRow+":"+teamTwoNamesRange.stpRow).sort({column: 2, ascending: true});
};

function sortPlayers() {
  var spreadsheet = SpreadsheetApp.getActive();
  spreadsheet.getRange('2:28').sort({column: 3, ascending: false});
};

function randomMap() {
  // Fit range between [0, 1)
  var buckets = [{lo: 0.00, hi: 0.25, map: "Split"},
                 {lo: 0.25, hi: 0.50, map: "Ascent"},
                 {lo: 0.50, hi: 0.75, map: "Haven"},
                 {lo: 0.75, hi: 1.00, map: "Bind"}]; // Last is default
  var numOfBuckets = buckets.length;
  var number = Math.random();
  for (let i = 0; i < numOfBuckets; i++) {
    if ((buckets[i].lo <= number && number < buckets[i].hi) ||
        i == numOfBuckets - 1) {
          Browser.msgBox("Random map selection: " + buckets[i].map);
          return;
    }
  }
  Browser.msgBox("Random map selection: " + buckets[numOfBuckets - 1].map);
};