/**
 * @file library.gs
 *
 * @brief Helper functions
 *
 * @date 15 May 2020
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
 * @brief Finds row of player matching name given
 * 
 * @param playerName    Name of player to find
 * 
 * @returns Row of player if found, and -1 if not found 
 */
function getPlayerRow(playerName) {
  // Iterate through each player
  var playerListRaw = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Players").getRange("B2:B99").getValues();
  var row;
  for (row = 0; playerListRaw[row][0] != ""; row++) {
    if (playerListRaw[row][0] == playerName) {
      // Found matching name, so update respective elo
      return Number(row+2);
    }
  }
  return -1;
}

/**
 * @brief Returns all unique team permutations
 * 
 * @param players  Array of elements to permutate
 * 
 * @returns Array of permutations, each with the same length as the input array
 */
function getPossibleTeams(players) {
  let result = [];
  function permute (arr, m = []) {
    if (arr.length === 0) {
      // Got full permutation in array m
      let teamOnePlayers = m.slice(0, Math.round(players.length/2));
      let teamOneElo = 0;
      let teamOneId = 0;
      for (let i = 0; i < teamOnePlayers.length; i++) {
        teamOneElo += teamOnePlayers[i].elo;
        teamOneId += teamOnePlayers[i].id;
      }
      let teamTwoPlayers = m.slice(Math.round(players.length/2));
      let teamTwoElo = 0;
      let teamTwoId = 0;
      for (let i = 0; i < teamTwoPlayers.length; i++) {
        teamTwoElo += teamTwoPlayers[i].elo;
        teamTwoId += teamTwoPlayers[i].id;
      }
      // Check if team IDs are already in the results array
      for (let i = 0; i < result.length; i++) {
        if (result[i].teamOne.id == teamOneId || // If team 1 ID matches
            result[i].teamTwo.id == teamTwoId || // If team 2 ID matches
            result[i].teamOne.id == teamTwoId) { // If teams are swapped
            // Duplicate found, so don't bother adding to the results
            return;
        }
      }
      // @debug:
      // Browser.msgBox(JSON.stringify({players: teamOnePlayers,elo: teamOneElo,id: teamOneId}));
      //Browser.msgBox(JSON.stringify({players: teamTwoPlayers,elo: teamTwoElo,id: teamTwoId}));
      // No duplicates found, so add to results array
      result.push({teamOne: {players: teamOnePlayers,
                             elo: teamOneElo,
                             id: teamOneId},
                   teamTwo: {players: teamTwoPlayers,
                             elo: teamTwoElo,
                             id: teamTwoId},
                   eloDifference: Math.abs(teamOneElo - teamTwoElo)
                  });
    } else {
      for (let i = 0; i < arr.length; i++) {
        let curr = arr.slice();
        let next = curr.splice(i, 1);
        permute(curr.slice(), m.concat(next))
     }
   }
 }
 permute(players)
 return result;
}

/**
 * @brief Clears combat scores for players on both teams
 */
function clearCombatScores() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange(teamOneCombatScoresRange.toString()).clearContent();
  addAMatchSheet.getRange(teamTwoCombatScoresRange.toString()).clearContent();
}

/**
 * @brief Clears rounds won for players on both teams
 */
function clearRoundsWon() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange(teamOneRoundsWonRange.toString()).clearContent();
  addAMatchSheet.getRange(teamTwoRoundsWonRange.toString()).clearContent();
}

/**
 * @brief Clears new elos output for players on both teams
 */
function clearNewElos() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange(teamOneNewElosRange.toString()).clearContent();
  addAMatchSheet.getRange(teamTwoNewElosRange.toString()).clearContent();
}

/**
 * @brief Determines if an input number is between two other given numbers
 * 
 * @param num     Number to check if it is in a given range
 * @param lo      Lower bound of the range
 * @param hi      Upper bound of the range
 * 
 * @returns boolean value of whether or not num is between lo and hi (inclusive)       
 */
function inRange(num, lo, hi) {
  return (num >= lo) && (num <= hi);
}

/**
 * @brief Pads a string to a certain length, and will truncate the string if it is too long
 * 
 * @param string        String to pad
 * @param targetLength  Target string length
 */
function padEnd(string, targetLength) {
  // Truncate string if too long
  if (string.length > targetLength) {
    string = string.slice(0, targetLength);
  }

  // Pad string if too short
  while (string.length < targetLength) {
    string += " ";
  }

  return string;
}