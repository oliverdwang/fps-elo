function updateMMR(teamOnePlayers, teamOneElos, teamOneScore,
                   teamTwoPlayers, teamTwoElos, teamTwoScore) {
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
  var teamOneScore = SpreadsheetApp.getActiveSpreadsheet().getRange("B7").getValue();
  var teamTwoPlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A9:A13").getValues();
  var teamTwoPlayers = [];
  for (let i = 0; i < teamTwoPlayersRaw.length; ++i) {
    teamTwoPlayers.push(teamTwoPlayersRaw[i][0]);
  }
  var teamTwoElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B9:B13").getValues();
  var teamTwoElos = [];
  for (let i = 0; i < teamTwoElosRaw.length; ++i) {
    teamTwoElos.push(teamTwoElosRaw[i][0]);
  }
  var teamTwoScore = SpreadsheetApp.getActiveSpreadsheet().getRange("B14").getValue();
  
  // Elo computation variables
  // Number of teams
  const n = 2;
  // Volatility factor
  const k = 96;
  
  var players = [];
  
  // Find cumulative Elo and parse players
  var teamOneSize = 0;
  var teamOneElo = 0;
  for (let i = 0; i < teamOnePlayers.length; i++) {
    if (teamOnePlayers[i] != "") {
      teamOneSize++;
      teamOneElo += teamOneElos[i];
      players.push({team: 1, name: teamOnePlayers[i], elo: teamOneElos[i], percEloLose: 0, percEloWin: 0});
    }
  }
  var teamTwoSize = 0;
  var teamTwoElo = 0;
  for (let i = 0; i < teamTwoPlayers.length; i++) {
    if (teamTwoPlayers[i] != "") {
      teamTwoSize++;
      teamTwoElo += teamTwoElos[i];
      players.push({team: 2, name: teamTwoPlayers[i], elo: teamTwoElos[i], percEloLose: 0, percEloWin: 0});
    }
  }
  
  // Find elo responsibility of individual team members in the case of losing
  for (let i = 0; i < teamOneSize; i++) {
    players[i].percEloLose = 100 * players[i].elo / teamOneElo;
  }
  
  for (let i = teamOneSize; i < teamOneSize+teamTwoSize; i++) {
    players[i].percEloLose = 100 * players[i].elo / teamTwoElo;
  }
  
  // Find elo responsibility of individual team members in the case of winning
  // Basic idea is to assign responsibility in reverse order for percEloLose, but need to adjust for multiple people with same elo
  var accumPerc = 0;
  var accumPlayers = 0;
  for (let i = 0; i < teamOneSize; i++) {
    if((i+1 < teamOneSize) && players[i].elo == players[i+1].elo) {
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
    if((i+1 < teamOneSize+teamTwoSize) && players[i].elo == players[i+1].elo) {
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
  // DEBUG:
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
  
  Browser.msgBox(teamOneEloChange);
  
  // Update elos of team members according to elo responsibility
  for (let i = 0; i < teamOneSize; i++) {
    players[i].elo += 0.01*teamOneEloChange*(s*players[i].percEloWin+(1-s)*players[i].percEloLose);
  }
  for (let i = teamOneSize; i < teamOneSize+teamTwoSize; i++) {
    players[i].elo += 0.01*teamTwoEloChange*((1-s)*players[i].percEloWin+s*players[i].percEloLose);
  }
  
  // Update spreadsheet
  var sheet = SpreadsheetApp.getActiveSheet();
  if (teamOneSize >= 1) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B21");
    range.setValue(players[0].elo);
  }
  if (teamOneSize >= 2) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B22");
    range.setValue(players[1].elo);
  }
  if (teamOneSize >= 3) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B23");
    range.setValue(players[2].elo);
  }
  if (teamOneSize >= 4) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B24");
    range.setValue(players[3].elo);
  }
  if (teamOneSize == 5) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B25");
    range.setValue(players[4].elo);
  }
  
  if (teamTwoSize >= 1) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D21");
    range.setValue(players[teamOneSize].elo);
  }
  if (teamTwoSize >= 2) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D22");
    range.setValue(players[teamOneSize+1].elo);
  }
  if (teamTwoSize >= 3) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D23");
    range.setValue(players[teamOneSize+2].elo);
  }
  if (teamTwoSize >= 4) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D24");
    range.setValue(players[teamOneSize+3].elo);
  }
  if (teamTwoSize == 5) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D25");
    range.setValue(players[teamOneSize+4].elo);
  }
  return;
}