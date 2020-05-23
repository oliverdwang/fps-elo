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
 * @brief Clears combat scores for players on both teams
 */
function clearCombatScores() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange("C12:C16").clearContent();
  addAMatchSheet.getRange("C21:C25").clearContent();
}

/**
 * @brief Clears rounds won for players on both teams
 */
function clearRoundsWon() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange("B18").clearContent();
  addAMatchSheet.getRange("B27").clearContent();
}

/**
 * @brief Clears new elos output for players on both teams
 */
function clearNewElos() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  addAMatchSheet.getRange("B31:B35").clearContent();
  addAMatchSheet.getRange("D31:D35").clearContent();
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