/**
 * @file elo.gs
 *
 * @brief Custom script to create competitive skill tracking environment for custom Valorant games
 *
 * @date 14 May 2020
 * 
 * @author Oliver Wang <odwang@cmu.edu>
 * 
 * Copyright (C) 2020  Oliver Wang            
 *            
 * This program is free software: you can redistribute it and/or modify            
 * it under the terms of the GNU Affero General Public License as published            
 * by the Free Software Foundation, either version 3 of the License, or            
 * (at your option) any later version.            
 *            
 * This program is distributed in the hope that it will be useful,            
 * but WITHOUT ANY WARRANTY; without even the implied warranty of            
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the            
 * GNU Affero General Public License for more details.            
 *            
 * You should have received a copy of the GNU Affero General Public License            
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @brief Returns an appropriate k value to use for a given game score disparity
 * 
 * @param teamOneScore  Number of rounds won by team one
 * @param teamTwoScore  Number of rounds won by team two
 * 
 * @returns k value to use for elo based ranking point adjustments
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
  var teamOnePlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A12:A16").getValues();
  var teamOneElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B12:B16").getValues();
  var teamOneCombatScoresRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("C12:C16").getValues();
  var teamOnePlayers = [];
  var teamOneElos = [];
  var teamOneCombatScores = [];
  var teamOneSize = 0;
  var teamOneElo = 0;
  for (let i = 0; i < teamOnePlayersRaw.length; i++) {
    var player = teamOnePlayersRaw[i][0];
    if (player != "") {
      teamOneSize++;
      var elo = teamOneElosRaw[i][0];
      teamOneElo += elo;
      teamOnePlayers.push(player)
      teamOneElos.push(elo);
      teamOneCombatScores.push(teamOneCombatScoresRaw[i][0]);
    }
  }

  var teamOneScore = SpreadsheetApp.getActiveSpreadsheet().getRange("B18").getValue();

  var teamTwoPlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A21:A25").getValues();
  var teamTwoElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B21:B25").getValues();
  var teamTwoCombatScoresRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("C21:C25").getValues();
  var teamTwoPlayers = [];
  var teamTwoElos = [];
  var teamTwoCombatScores = [];
  var teamTwoSize = 0;
  var teamTwoElo = 0;
  for (let i = 0; i < teamTwoPlayersRaw.length; ++i) {
    var player = teamTwoPlayersRaw[i][0];
    if (player != "") {
      teamTwoSize++;
      var elo = teamTwoElosRaw[i][0];
      teamTwoElo += elo;
      teamTwoPlayers.push(player);
      teamTwoElos.push(elo);
      teamTwoCombatScores.push(teamTwoCombatScoresRaw[i][0]);
    }
  }

  var teamTwoScore = SpreadsheetApp.getActiveSpreadsheet().getRange("B27").getValue();

  Browser.msgBox(teamTwoPlayers[0]+" "+teamTwoPlayers[1]+" "+teamTwoPlayers[2]+" "+teamTwoPlayers[3]+" "+teamTwoPlayers[4]);
  return;
  
  // Elo computation variables
  // Number of teams
  const n = 2;
  // Volatility factor
  const k = determineK(teamOneScore, teamTwoScore);
  
  // Array to hold all players
  var players = [];
  
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

  // Update players tab
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Players");
  // Iterate through each player
  for (let i = 0; i < teamOneSize+teamTwoSize; i++) {
    var playerListRaw = sheet.getRange("B2:B99").getValues();
    var row;
    for (row = 0; playerListRaw[row][0] != ""; row++) {
      if (playerListRaw[row][0] == players[i].name) {
        // Found matching name, so update respective elo
        sheet.getRange("C"+Number(row+2)).setValue(players[i].postElo);
        break;
      }
    }
    if (playerListRaw[row][0] == "") {
      Browser.msgBox("Error: Player not found");
      return;
    }
  }
  
  // Update spreadsheet for quick view
  if (teamOneSize >= 1) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("B31");
    range.setValue(players[0].postElo);

    if (teamOneSize >= 2) {
      range = SpreadsheetApp.getActiveSpreadsheet().getRange("B32");
      range.setValue(players[1].postElo);

      if (teamOneSize >= 3) {
        range = SpreadsheetApp.getActiveSpreadsheet().getRange("B33");
        range.setValue(players[2].postElo);

        if (teamOneSize >= 4) {
          range = SpreadsheetApp.getActiveSpreadsheet().getRange("B34");
          range.setValue(players[3].postElo);
        
          if (teamOneSize == 5) {
            range = SpreadsheetApp.getActiveSpreadsheet().getRange("B35");
            range.setValue(players[4].postElo);
          }
        }
      }
    }
  } 
  if (teamTwoSize >= 1) {
    var range = SpreadsheetApp.getActiveSpreadsheet().getRange("D31");
    range.setValue(players[teamOneSize].postElo);

    if (teamTwoSize >= 2) {
      range = SpreadsheetApp.getActiveSpreadsheet().getRange("D32");
      range.setValue(players[teamOneSize+1].postElo);
    
      if (teamTwoSize >= 3) {
        range = SpreadsheetApp.getActiveSpreadsheet().getRange("D33");
        range.setValue(players[teamOneSize+2].postElo);

        if (teamTwoSize >= 4) {
          range = SpreadsheetApp.getActiveSpreadsheet().getRange("D34");
          range.setValue(players[teamOneSize+3].postElo);
        
          if (teamTwoSize == 5) {
            range = SpreadsheetApp.getActiveSpreadsheet().getRange("D35");
            range.setValue(players[teamOneSize+4].postElo);
          }
        }
      }
    }
  }

  updateHistory(players, teamOneScore, teamTwoScore, teamOneSize, teamTwoSize);
  return;
}

/**
 * @brief Finds the first row with blank cell in timestamp column
 * 
 * @returns Row number that is empty
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

/**
 * @brief Adds log to round history
 * 
 * @param players       Array of player that were in the game
 * @param teamOneScore  Number of rounds won by team one
 * @param teamTwoScore  Number of rounds won by team two
 * @param teamOneSize   Number of players in team one
 * @param teamTwoSize   Number of players in team two
 */
function updateHistory(players, teamOneScore, teamTwoScore, teamOneSize, teamTwoSize) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Match History");
  var firstEmptyRow = getFirstEmptyRow();

  // Write timestamp
  sheet.getRange("A"+firstEmptyRow).setValue(new Date().toLocaleString());

  // Write metrics from players
  if (teamOneSize >= 1) {
    sheet.getRange("B"+firstEmptyRow).setValue(players[0].name);
    sheet.getRange("C"+firstEmptyRow).setValue(players[0].preElo);
    sheet.getRange("D"+firstEmptyRow).setValue(players[0].combatScore);
    sheet.getRange("E"+firstEmptyRow).setValue(players[0].postElo);
    if (teamOneSize >= 2) {
      sheet.getRange("F"+firstEmptyRow).setValue(players[1].name);
      sheet.getRange("G"+firstEmptyRow).setValue(players[1].preElo);
      sheet.getRange("H"+firstEmptyRow).setValue(players[1].combatScore);
      sheet.getRange("I"+firstEmptyRow).setValue(players[1].postElo);
      if (teamOneSize >= 3) {
        sheet.getRange("J"+firstEmptyRow).setValue(players[2].name);
        sheet.getRange("K"+firstEmptyRow).setValue(players[2].preElo);
        sheet.getRange("L"+firstEmptyRow).setValue(players[2].combatScore);
        sheet.getRange("M"+firstEmptyRow).setValue(players[2].postElo);
        if (teamOneSize >= 4) {
          sheet.getRange("N"+firstEmptyRow).setValue(players[3].name);
          sheet.getRange("O"+firstEmptyRow).setValue(players[3].preElo);
          sheet.getRange("P"+firstEmptyRow).setValue(players[3].combatScore);
          sheet.getRange("Q"+firstEmptyRow).setValue(players[3].postElo);
          if (teamOneSize == 5) {
            sheet.getRange("R"+firstEmptyRow).setValue(players[4].name);
            sheet.getRange("S"+firstEmptyRow).setValue(players[4].preElo);
            sheet.getRange("T"+firstEmptyRow).setValue(players[4].combatScore);
            sheet.getRange("U"+firstEmptyRow).setValue(players[4].postElo);
          }
        }
      }
    }
  }
  if (teamTwoSize >= 1) {
    sheet.getRange("V"+firstEmptyRow).setValue(players[teamOneSize].name);
    sheet.getRange("W"+firstEmptyRow).setValue(players[teamOneSize].preElo);
    sheet.getRange("X"+firstEmptyRow).setValue(players[teamOneSize].combatScore);
    sheet.getRange("Y"+firstEmptyRow).setValue(players[teamOneSize].postElo);
    if (teamTwoSize >= 2) {
      sheet.getRange("Z"+firstEmptyRow).setValue(players[teamOneSize+1].name);
      sheet.getRange("AA"+firstEmptyRow).setValue(players[teamOneSize+1].preElo);
      sheet.getRange("AB"+firstEmptyRow).setValue(players[teamOneSize+1].combatScore);
      sheet.getRange("AC"+firstEmptyRow).setValue(players[teamOneSize+1].postElo);
      if (teamTwoSize >= 3) {
        sheet.getRange("AD"+firstEmptyRow).setValue(players[teamOneSize+2].name);
        sheet.getRange("AE"+firstEmptyRow).setValue(players[teamOneSize+2].preElo);
        sheet.getRange("AF"+firstEmptyRow).setValue(players[teamOneSize+2].combatScore);
        sheet.getRange("AG"+firstEmptyRow).setValue(players[teamOneSize+2].postElo);
        if (teamTwoSize >= 4) {
          sheet.getRange("AH"+firstEmptyRow).setValue(players[teamOneSize+3].name);
          sheet.getRange("AI"+firstEmptyRow).setValue(players[teamOneSize+3].preElo);
          sheet.getRange("AJ"+firstEmptyRow).setValue(players[teamOneSize+3].combatScore);
          sheet.getRange("AK"+firstEmptyRow).setValue(players[teamOneSize+3].postElo);
          if (teamTwoSize == 5) {
            sheet.getRange("AL"+firstEmptyRow).setValue(players[teamOneSize+4].name);
            sheet.getRange("AM"+firstEmptyRow).setValue(players[teamOneSize+4].preElo);
            sheet.getRange("AN"+firstEmptyRow).setValue(players[teamOneSize+4].combatScore);
            sheet.getRange("AO"+firstEmptyRow).setValue(players[teamOneSize+4].postElo);
          }
        }
      }
    }
  }

  // Write rounds won
  sheet.getRange("AP"+firstEmptyRow).setValue(teamOneScore);
  sheet.getRange("AQ"+firstEmptyRow).setValue(teamTwoScore);

  // @todo clear names, combat score, rounds won

  return false;
}

function revertGame() {
  // @todo add revert game functionality
}

function balanceTeams() {
  // Collect tuples of (player name, player elo)
  var teamOnePlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A12:A16").getValues();
  var teamOneElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B12:B16").getValues();
  var teamTwoPlayersRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("A21:A25").getValues();
  var teamTwoElosRaw = SpreadsheetApp.getActiveSpreadsheet().getRange("B21:B25").getValues();
  var players = [];
  for (let i = 0; i < teamOnePlayersRaw.length; i++) {
    if (teamOnePlayersRaw[i][0] != "") {
      players.push({name: teamOnePlayersRaw[i][0], elo: teamOneElosRaw[i][0]});
    }
  }
  for (let i = 0; i < teamTwoPlayersRaw.length; i++) {
    if (teamTwoPlayersRaw[i][0] != "") {
      players.push({name: teamTwoPlayersRaw[i][0], elo: teamTwoElosRaw[i][0]});
    }
  }

  // Sort all players from highest elo to lowest elo
  players.sort(function (a,b) {
    return b.elo - a.elo;
  });

  // Assign teams 
  teamOnePlayersRaw = [];
  teamTwoPlayersRaw = [];
  teamOneElosRaw = [];
  teamTwoElosRaw = [];
  var teamOneElo = 0;
  var teamTwoElo = 0;
  while (players.length > 0) {
    var player = players.pop();
    //Browser.msgBox(players.length+":"+player.name+","+player.elo);
    if (teamOneElo <= teamTwoElo) {
      teamOnePlayersRaw.push(player.name);
      teamOneElosRaw.push(player.elo);
      teamOneElo += player.elo;
    } else {
      teamTwoPlayersRaw.push(player.name);
      teamTwoElosRaw.push(player.elo);
      teamTwoElo += player.elo;
    }
  }
  var teamOneSize = teamOnePlayersRaw.length;
  var teamTwoSize = teamTwoPlayersRaw.length;
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  if (teamOneSize >= 1) {
    sheet.getRange("A12").setValue(teamOnePlayersRaw[0]);
    if (teamOneSize >= 2) {
      sheet.getRange("A13").setValue(teamOnePlayersRaw[1]);
      if (teamOneSize >= 3) {
        sheet.getRange("A14").setValue(teamOnePlayersRaw[2]);
        if (teamOneSize >= 4) {
          sheet.getRange("A15").setValue(teamOnePlayersRaw[3]);
          if (teamOneSize == 5) {
            sheet.getRange("A16").setValue(teamOnePlayersRaw[4]);
          }
        }
      }
    }
  }
  if (teamTwoSize >= 1) {
    sheet.getRange("A21").setValue(teamTwoPlayersRaw[0]);
    if (teamOneSize >= 2) {
      sheet.getRange("A22").setValue(teamTwoPlayersRaw[1]);
      if (teamOneSize >= 3) {
        sheet.getRange("A23").setValue(teamTwoPlayersRaw[2]);
        if (teamOneSize >= 4) {
          sheet.getRange("A24").setValue(teamTwoPlayersRaw[3]);
          if (teamOneSize == 5) {
            sheet.getRange("A25").setValue(teamTwoPlayersRaw[4]);
          }
        }
      }
    }
  }
  // @todo clear new elo, combat score, rounds won
}