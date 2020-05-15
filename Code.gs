/**
 * @file Code.gs
 *
 * @brief Custom script to create competitive skill tracking environment for custom Valorant games
 *
 * @date 14 May 2020
 *
 * @author Oliver Wang <odwang@cmu.edu>
 */

/**
 * @brief Determines if an input number is between two other given numbers
 */
function inRange(num, lo, hi) {
  return (num >= lo) && (num <= hi);
}

/**
 * @brief Returns an appropriate k value to use for a given game score disparity
 */
function determineK(teamOneScore, teamTwoScore) {
  // Parameters
  var buckets = [{lo: 0.00, hi: 0.25, k: 128}, // score of 0/13 to 3/13
                 {lo: 0.25, hi: 0.50, k: 96},  // score of 4/13 to 6/13
                 {lo: 0.50, hi: 0.75, k: 64},  // score of 7/13 to 9/13
                 {lo: 0.75, hi: 1.00, k: 32}]; // score of 10/13 to 13/13
  var defaultK = 32;
  
  var decisiveness = Math.min(teamOneScore, teamTwoScore) / Math.max(teamOneScore, teamTwoScore);
  for (let i = 0; i < buckets.length; i++) {
    if (inRange(decisiveness, buckets[i].lo, buckets[i].hi)) {
      return buckets[i].k;
    }
  }
  return defaultK;
}

/**
 * @brief Updates the ELO for a given match of up to 5v5
 */
function updateELO() {
  //Inputs
  var teamOnePlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A2:A6").getValues();
  var teamOnePlayers = [];
  for (let i = 0; i < teamOnePlayersRaw.length; ++i) {
    teamOnePlayers.push(teamOnePlayersRaw[i][0]);
  }
  var teamOneElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B2:B6").getValues();
  var teamOneElos = [];
  for (let i = 0; i < teamOneElosRaw.length; ++i) {
    teamOneElos.push(teamOneElosRaw[i][0]);
  }
  var teamOneScore = SpreadsheetApp.getActiveSpreadsheet().getRange("B8").getValue();
  var teamTwoPlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A11:A15").getValues();
  var teamTwoPlayers = [];
  for (let i = 0; i < teamTwoPlayersRaw.length; ++i) {
    teamTwoPlayers.push(teamTwoPlayersRaw[i][0]);
  }
  var teamTwoElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B11:B15").getValues();
  var teamTwoElos = [];
  for (let i = 0; i < teamTwoElosRaw.length; ++i) {
    teamTwoElos.push(teamTwoElosRaw[i][0]);
  }
  var teamTwoScore = SpreadsheetApp.getActiveSpreadsheet().getRange("B17").getValue();
  
  // Elo computation variables
  // Number of teams
  const n = 2;
  // Volatility factor
  const k = determineK(teamOneScore, teamTwoScore);
  
  // Array to hold all players
  var players = [];
  
  // Find cumulative Elo and parse players
  var teamOneSize = 0;
  var teamOneElo = 0;
  for (let i = 0; i < teamOnePlayers.length; i++) {
    if (teamOnePlayers[i] != "") {
      teamOneSize++;
      teamOneElo += teamOneElos[i];
      players.push({name: teamOnePlayers[i], preElo: teamOneElos[i], postElo: teamOneElos[i], percEloLose: 0, percEloWin: 0});
    }
  }
  var teamTwoSize = 0;
  var teamTwoElo = 0;
  for (let i = 0; i < teamTwoPlayers.length; i++) {
    if (teamTwoPlayers[i] != "") {
      teamTwoSize++;
      teamTwoElo += teamTwoElos[i];
      players.push({name: teamTwoPlayers[i], preElo: teamTwoElos[i], postElo: teamTwoElos[i], percEloLose: 0, percEloWin: 0});
    }
  }
  
  // Find elo responsibility of individual team members in the case of losing
  for (let i = 0; i < teamOneSize; i++) {
    players[i].percEloLose = 100 * players[i].preElo / teamOneElo;
  }
  
  for (let i = teamOneSize; i < teamOneSize+teamTwoSize; i++) {
    players[i].percEloLose = 100 * players[i].preElo / teamTwoElo;
  }
  
  // Find elo responsibility of individual team members in the case of winning
  // Basic idea is to assign responsibility in reverse order for percEloLose, but need to adjust for multiple people with same elo
  var accumPerc = 0;
  var accumPlayers = 0;
  for (let i = 0; i < teamOneSize; i++) {
    if((i+1 < teamOneSize) && players[i].preElo == players[i+1].preElo) {
      // Multiple players with same elo, so accumulate opposing responsibility
      accumPerc += players[teamOneSize-i-1].percEloLose;
      accumPlayers++;
    } else {
      if (accumPlayers != 0) {
        // End of streak of people with the same lo
        accumPerc += players[teamOneSize-i-1].percEloLose;
        accumPlayers++;
        var avgPerc = accumPerc / accumPlayers;
        // Distribute avgPerc across players with same elo
        for (let j = i; accumPlayers > 0; j--) {
          players[j].percEloWin = avgPerc;
          accumPlayers--;
        }
        // Reset counters
        accumPlayers = 0;
        accumPerc = 0;
      } else {
        // Unique elos, so no finagling needed
        players[i].percEloWin = players[teamOneSize-i-1].percEloLose;
      }
    }
  }
  accumPerc = 0;
  accumPlayers = 0;
  for (let i = teamOneSize; i < teamOneSize+teamTwoSize; i++) {
    if((i+1 < teamOneSize+teamTwoSize) && players[i].preElo == players[i+1].preElo) {
      // Multiple players with same elo, so accumulate opposing responsibility
      accumPerc += players[teamOneSize+teamTwoSize-i-1].percEloLose;
      accumPlayers++;
    } else {
      if (accumPlayers != 0) {
        // End of streak of people with the same lo
        accumPerc += players[teamOneSize+teamTwoSize-i-1].percEloLose;
        accumPlayers++;
        var avgPerc = accumPerc / accumPlayers;
        // Distribute avgPerc across players with same elo
        for (let j = i; accumPlayers > 0; j--) {
          players[j].percEloWin = avgPerc;
          accumPlayers--;
        }
        // Reset counters
        accumPlayers = 0;
        accumPerc = 0;
      } else {
        // Unique elos, so no finagling needed
        players[i].percEloWin = players[teamOneSize+teamOneSize-i-1].percEloLose;
      }
    }
  }
  // FOR DEBUG:
  //Browser.msgBox("team1: "+players[0].percEloWin+" "+players[1].percEloWin+" "+players[2].percEloWin+" "+players[3].percEloWin+" "+players[4].percEloWin)
  
  // Compute Elo as overall teams
  let s = 9;
  if (teamOneScore > teamTwoScore) {
    s = 1;
  } else if (teamOneScore < teamTwoScore) {
    s = 0;
  } else {
    s = 0.5;
  }
  const ea = 1 / (1 + Math.pow(10, (teamTwoElo - teamOneElo) / 400));
  var teamOneEloChange = Math.round(k * (s - ea));
  var teamTwoEloChange = -teamOneEloChange;
  
  // Update elos of team members according to elo responsibility
  for (let i = 0; i < teamOneSize; i++) {
    players[i].postElo += 0.01*teamOneEloChange*(s*players[i].percEloWin+(1-s)*players[i].percEloLose);
  }
  for (let i = teamOneSize; i < teamOneSize+teamTwoSize; i++) {
    players[i].postElo += 0.01*teamTwoEloChange*((1-s)*players[i].percEloWin+s*players[i].percEloLose);
  }
  
  // Update spreadsheet
  if (teamOneSize >= 1) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B20");
    range.setValue(players[0].postElo);

    if (teamOneSize >= 2) {
      range = SpreadsheetApp.getActiveSpreadsheet().getRange("B21");
      range.setValue(players[1].postElo);

      if (teamOneSize >= 3) {
        range = SpreadsheetApp.getActiveSpreadsheet().getRange("B22");
        range.setValue(players[2].postElo);

        if (teamOneSize >= 4) {
          range = SpreadsheetApp.getActiveSpreadsheet().getRange("B23");
          range.setValue(players[3].postElo);
        
          if (teamOneSize == 5) {
            range = SpreadsheetApp.getActiveSpreadsheet().getRange("B24");
            range.setValue(players[4].postElo);
          }
        }
      }
    }
  } 
  if (teamTwoSize >= 1) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D20");
    range.setValue(players[teamOneSize].postElo);

    if (teamTwoSize >= 2) {
      range = SpreadsheetApp.getActiveSpreadsheet().getRange("D21");
      range.setValue(players[teamOneSize+1].postElo);
    
      if (teamTwoSize >= 3) {
        range = SpreadsheetApp.getActiveSpreadsheet().getRange("D22");
        range.setValue(players[teamOneSize+2].postElo);

        if (teamTwoSize >= 4) {
          range = SpreadsheetApp.getActiveSpreadsheet().getRange("D23");
          range.setValue(players[teamOneSize+3].postElo);
        
          if (teamTwoSize == 5) {
            range = SpreadsheetApp.getActiveSpreadsheet().getRange("D24");
            range.setValue(players[teamOneSize+4].postElo);
          }
        }
      }
    }
  }

  updateHistory(players, teamOneSize, teamTwoSize);
  return;
}

/**
 * @brief Returns first row with blank cell in column A
 */
function getFirstEmptyRow() {
  var spr = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Match History");
  var column = spr.getRange('A:A');
  var values = column.getValues(); // get all data in one call
  var ct = 0;
  while ( values[ct][0] != "" ) {
    ct++;
  }
  return (ct+1);
}

function updateHistory(players, teamOneSize, teamTwoSize) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Match History");
  var firstEmptyRow = getFirstEmptyRow();

  // Write timestamp
  sheet.getRange("A"+firstEmptyRow).setValue(new Date().toLocaleString());

  // Write metrics from players
  if (teamOneSize >= 1) {
    sheet.getRange("B"+firstEmptyRow).setValue(players[0].name);
    sheet.getRange("C"+firstEmptyRow).setValue(players[0].preElo);
    sheet.getRange("E"+firstEmptyRow).setValue(players[0].postElo);
    if (teamOneSize >= 2) {
      sheet.getRange("F"+firstEmptyRow).setValue(players[1].name);
      sheet.getRange("G"+firstEmptyRow).setValue(players[1].preElo);
      sheet.getRange("I"+firstEmptyRow).setValue(players[1].postElo);
      if (teamOneSize >= 3) {
        sheet.getRange("J"+firstEmptyRow).setValue(players[2].name);
        sheet.getRange("K"+firstEmptyRow).setValue(players[2].preElo);
        sheet.getRange("M"+firstEmptyRow).setValue(players[2].postElo);
        if (teamOneSize >= 4) {
          sheet.getRange("N"+firstEmptyRow).setValue(players[3].name);
          sheet.getRange("O"+firstEmptyRow).setValue(players[3].preElo);
          sheet.getRange("Q"+firstEmptyRow).setValue(players[3].postElo);
          if (teamOneSize == 5) {
            sheet.getRange("R"+firstEmptyRow).setValue(players[4].name);
            sheet.getRange("S"+firstEmptyRow).setValue(players[4].preElo);
            sheet.getRange("U"+firstEmptyRow).setValue(players[4].postElo);
          }
        }
      }
    }
  }
  if (teamTwoSize >= 1) {
    sheet.getRange("V"+firstEmptyRow).setValue(players[teamOneSize].name);
    sheet.getRange("W"+firstEmptyRow).setValue(players[teamOneSize].preElo);
    sheet.getRange("Y"+firstEmptyRow).setValue(players[teamOneSize].postElo);
    if (teamTwoSize >= 2) {
      sheet.getRange("Z"+firstEmptyRow).setValue(players[teamOneSize+1].name);
      sheet.getRange("AA"+firstEmptyRow).setValue(players[teamOneSize+1].preElo);
      sheet.getRange("AC"+firstEmptyRow).setValue(players[teamOneSize+1].postElo);
      if (teamTwoSize >= 3) {
        sheet.getRange("AD"+firstEmptyRow).setValue(players[teamOneSize+2].name);
        sheet.getRange("AE"+firstEmptyRow).setValue(players[teamOneSize+2].preElo);
        sheet.getRange("AG"+firstEmptyRow).setValue(players[teamOneSize+2].postElo);
        if (teamTwoSize >= 4) {
          sheet.getRange("AH"+firstEmptyRow).setValue(players[teamOneSize+3].name);
          sheet.getRange("AI"+firstEmptyRow).setValue(players[teamOneSize+3].preElo);
          sheet.getRange("AK"+firstEmptyRow).setValue(players[teamOneSize+3].postElo);
          if (teamTwoSize == 5) {
            sheet.getRange("AL"+firstEmptyRow).setValue(players[teamOneSize+4].name);
            sheet.getRange("AM"+firstEmptyRow).setValue(players[teamOneSize+4].preElo);
            sheet.getRange("AO"+firstEmptyRow).setValue(players[teamOneSize+4].postElo);
          }
        }
      }
    }
  }
  return false;
}

function balanceTeams() {
  //Browser.msgBox("Hi "+getFirstEmptyRow());
}