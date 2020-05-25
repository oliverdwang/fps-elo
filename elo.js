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
 * @param teamOneRoundsWon  Number of rounds won by team one
 * @param teamTwoRoundsWon  Number of rounds won by team two
 * 
 * @returns k value to use for elo based ranking point adjustments
 */
function determineK(teamOneRoundsWon, teamTwoRoundsWon) {
  // Parameters
  var buckets = [{lo: 0.00, hi: 0.25, k: 128}, // score of 0/13 to 3/13
                 {lo: 0.25, hi: 0.50, k: 96},  // score of 4/13 to 6/13
                 {lo: 0.50, hi: 0.80, k: 64},  // score of 7/13 to 10/13
                 {lo: 0.80, hi: 1.00, k: 32}]; // score of 11/13 to 13/13
  var defaultK = 32;
  
  var decisiveness = Math.min(teamOneRoundsWon, teamTwoRoundsWon) / Math.max(teamOneRoundsWon, teamTwoRoundsWon);
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
  // Sort players in terms of elo
  addAMatchSheet.getRange(teamOneNamesRange.strRow+":"+teamOneNamesRange.stpRow).sort({column: 2, ascending: true});
  addAMatchSheet.getRange(teamTwoNamesRange.strRow+":"+teamTwoNamesRange.stpRow).sort({column: 2, ascending: true});
  //Inputs
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  var teamOnePlayersRaw = addAMatchSheet.getRange(teamOneNamesRange.toString()).getValues();
  var teamOneElosRaw = addAMatchSheet.getRange(teamOneElosRange.toString()).getValues();
  var teamOneCombatScoresRaw = addAMatchSheet.getRange(teamOneCombatScoresRange.toString()).getValues();
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

  var teamOneRoundsWon = addAMatchSheet.getRange(teamOneRoundsWonRange.toString()).getValue();

  var teamTwoPlayersRaw = addAMatchSheet.getRange(teamTwoNamesRange.toString()).getValues();
  var teamTwoElosRaw = addAMatchSheet.getRange(teamTwoElosRange.toString()).getValues();
  var teamTwoCombatScoresRaw = addAMatchSheet.getRange(teamTwoCombatScoresRange.toString()).getValues();
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

  var teamTwoRoundsWon = addAMatchSheet.getRange(teamTwoRoundsWonRange.toString()).getValue();

  // Put player statistics into player objects and unified array
  var players = [];
  for (let i = 0; i < teamOneSize; i++) {
    players.push({name: teamOnePlayers[i], preElo: teamOneElos[i], postElo: teamOneElos[i],
                  percEloLose: 0, percEloWin: 0, combatScore: teamOneCombatScores[i]});
  }
  for (let i = 0; i < teamTwoSize; i++) {
    players.push({name: teamTwoPlayers[i], preElo: teamTwoElos[i], postElo: teamTwoElos[i],
                  percEloLose: 0, percEloWin: 0, combatScore: teamTwoCombatScores[i]});
  }
  
  // Elo computation variables
  // Number of teams
  const n = 2;
  // Volatility factor
  const k = determineK(teamOneRoundsWon, teamTwoRoundsWon);
  
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
  if (teamOneRoundsWon > teamTwoRoundsWon) {
    s = 1;
  } else if (teamOneRoundsWon < teamTwoRoundsWon) {
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
    var row = getPlayerRow(players[i].name)
    if (row > 0) {
      // Found matching name, so update respective elo
      sheet.getRange("C"+row).setValue(players[i].postElo);
    } else {
      // Invalid row found
      Browser.msgBox("Error: Player not found");
      return;
    }
  }
  
  // Update spreadsheet for quick view
  var output = new Array(5).fill("").map(() => new Array(1).fill(""));
  for (let i = 0; i < teamOneSize; i++) {
    output[i][0] = players[i].postElo;
  }
  addAMatchSheet.getRange(teamOneNewElosRange.toString()).setValues(output);
  output = new Array(5).fill("").map(() => new Array(1).fill(""));
  for (let i = 0; i < teamTwoSize; i++) {
    output[i][0] = players[teamOneSize+i].postElo;
  }
  addAMatchSheet.getRange(teamTwoNewElosRange.toString()).setValues(output);

  updateHistory(players, teamOneRoundsWon, teamTwoRoundsWon, teamOneSize, teamTwoSize);

  clearCombatScores();
  clearRoundsWon();

  return;
}

/**
 * @brief Adds log to round history
 * 
 * @param players       Array of player that were in the game
 * @param teamOneRoundsWon  Number of rounds won by team one
 * @param teamTwoRoundsWon  Number of rounds won by team two
 * @param teamOneSize   Number of players in team one
 * @param teamTwoSize   Number of players in team two
 */
function updateHistory(players, teamOneRoundsWon, teamTwoRoundsWon, teamOneSize, teamTwoSize) {
  var matchHistorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Match History");
  var firstEmptyRow = getFirstEmptyRow();

  // Write timestamp
  matchHistorySheet.getRange(matchHistGameInfoCols.timestampCol+firstEmptyRow)
                   .setValue(new Date().toLocaleString());

  // Write metrics from players
  for (let i = 0; i < teamOneSize; i++) {
    matchHistorySheet.getRange(matchHistTeamOneCols[i].nameCol+firstEmptyRow)
                     .setValue(players[i].name);
    matchHistorySheet.getRange(matchHistTeamOneCols[i].preEloCol+firstEmptyRow)
                     .setValue(players[i].preElo);
    matchHistorySheet.getRange(matchHistTeamOneCols[i].combatScoreCol+firstEmptyRow)
                     .setValue(players[i].combatScore);
    matchHistorySheet.getRange(matchHistTeamOneCols[i].postEloCol+firstEmptyRow)
                     .setValue(players[i].postElo);
  }
  for (let i = 0; i < teamTwoSize; i++) {
    matchHistorySheet.getRange(matchHistTeamTwoCols[i].nameCol+firstEmptyRow)
                     .setValue(players[teamOneSize+i].name);
    matchHistorySheet.getRange(matchHistTeamTwoCols[i].preEloCol+firstEmptyRow)
                     .setValue(players[teamOneSize+i].preElo);
    matchHistorySheet.getRange(matchHistTeamTwoCols[i].combatScoreCol+firstEmptyRow)
                     .setValue(players[teamOneSize+i].combatScore);
    matchHistorySheet.getRange(matchHistTeamTwoCols[i].postEloCol+firstEmptyRow)
                     .setValue(players[teamOneSize+i].postElo);
  }

  // Write rounds won
  matchHistorySheet.getRange(matchHistGameInfoCols.teamOneRoundsWonCol+firstEmptyRow)
                   .setValue(teamOneRoundsWon);
  matchHistorySheet.getRange(matchHistGameInfoCols.teamTwoRoundsWonCol+firstEmptyRow)
                   .setValue(teamTwoRoundsWon);

  return false;
}

/**
 * @brief Reverts the last recorded game
 */
function revertGame() {
  // Verify that user wants to proceed
  var input = Browser.inputBox("This is not reversible! Type revert to continue, otherwise click cancel.", Browser.Buttons.OK_CANCEL);
  if (input != "revert") {
    return;
  }
  // Get row of match history to revert
  var playersSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Players");
  var matchHistorySheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Match History");
  var matchHistoryRow = getFirstEmptyRow() - 1;
  if (matchHistoryRow > 1) {
    var gameRange = matchHistorySheet.getRange("A"+matchHistoryRow+":AQ"+matchHistoryRow);
    var gameData = gameRange.getValues();
    // @todo abstract the following into function calls
    // Revert team 1 player 1 if present
    // T1P1 Name = Column B = index 1
    if (gameData[0][1] != "") {
      var playerRow = getPlayerRow(gameData[0][1]);
      if (playerRow > 0) {
        // Revert elo
        // T1P1 preELO = Row C = index 2
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][2]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 1 player 2 if present
    // T1P2 Name = Column F = index 5
    if (gameData[0][5] != "") {
      var playerRow = getPlayerRow(gameData[0][5]);
      if (playerRow > 0) {
        // Revert elo
        // T1P1 preELO = Row G = index 6
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][6]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 1 player 3 if present
    // T1P3 Name = Column J = index 9
    if (gameData[0][9] != "") {
      var playerRow = getPlayerRow(gameData[0][9]);
      if (playerRow > 0) {
        // Revert elo
        // T1P3 preELO = Row K = index 10
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][10]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 1 player 4 if present
    // T1P4 Name = Column N = index 13
    if (gameData[0][13] != "") {
      var playerRow = getPlayerRow(gameData[0][13]);
      if (playerRow > 0) {
        // Revert elo
        // T1P4 preELO = Row O = index 14
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][14]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 1 player 5 if present
    // T1P5 Name = Column R = index 17
    if (gameData[0][17] != "") {
      var playerRow = getPlayerRow(gameData[0][17]);
      if (playerRow > 0) {
        // Revert elo
        // T1P5 preELO = Row S = index 18
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][18]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 2 player 1 if present
    // T2P1 Name = Column V = index 21
    if (gameData[0][21] != "") {
      var playerRow = getPlayerRow(gameData[0][21]);
      if (playerRow > 0) {
        // Revert elo
        // T2P1 preELO = Row W = index 22
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][22]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 2 player 2 if present
    // T2P2 Name = Column Z = index 25
    if (gameData[0][25] != "") {
      var playerRow = getPlayerRow(gameData[0][25]);
      if (playerRow > 0) {
        // Revert elo
        // T2P2 preELO = Row AA = index 26
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][26]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 2 player 3 if present
    // T2P3 Name = Column AD = index 29
    if (gameData[0][29] != "") {
      var playerRow = getPlayerRow(gameData[0][29]);
      if (playerRow > 0) {
        // Revert elo
        // T2P3 preELO = Row AE = index 30
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][30]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 2 player 4 if present
    // T2P4 Name = Column AH = index 33
    if (gameData[0][33] != "") {
      var playerRow = getPlayerRow(gameData[0][33]);
      if (playerRow > 0) {
        // Revert elo
        // T2P4 preELO = Row AI = index 34
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][34]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Revert team 2 player 5 if present
    // T2P5 Name = Column AL = index 37
    if (gameData[0][37] != "") {
      var playerRow = getPlayerRow(gameData[0][37]);
      if (playerRow > 0) {
        // Revert elo
        // T2P5 preELO = Row AM = index 38
        playersSheet.getRange("C"+playerRow).setValue(gameData[0][38]);
      } else {
        // Player not found
        Browser.msgBox("Error: Match history is corrupted, player not found");
      }
    }
    // Remove match from match history
    gameRange.clearContent();
    clearCombatScores();
    clearRoundsWon();
    clearNewElos();
  } else {
    // No match to remove
    Browser.msgBox("No matches to revert");
  }
}