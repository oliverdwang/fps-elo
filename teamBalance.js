/**
 * @file teamBalance.gs
 *
 * @brief Automated team balancer functions
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
 * @brief Balances the teams
 */
function balanceTeams() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  // Collect tuples of (player name, player elo)
  var teamOnePlayersRaw = addAMatchSheet.getRange(teamOnePlayersRange).getValues();
  var teamOneElosRaw = addAMatchSheet.getRange(teamOneElosRange).getValues();
  var teamTwoPlayersRaw = addAMatchSheet.getRange(teamTwoPlayersRange).getValues();
  var teamTwoElosRaw = addAMatchSheet.getRange(teamTwoElosRange).getValues();
  var players = [];
  /* Rationale behind player IDs:
   * Possible teams are generated by permutations of players, and thus multiple teams generated
   * will actually be the same teams, but in different player orders. In order to solve this, each
   * player is assigned an ID that is a power of 2, and the team ID can be calculated by summing
   * the IDs of the players in the team. Repeated teams can then be identified by checking the team
   * ID of different teams, and these repeated teams would have the same team ID.
   */
  var nextId = 1;

  for (let i = 0; i < teamOnePlayersRaw.length; i++) {
    if (teamOnePlayersRaw[i][0] != "") {
      players.push({name: teamOnePlayersRaw[i][0], elo: teamOneElosRaw[i][0], id: nextId});
      nextId *= 2;
    }
  }
  for (let i = 0; i < teamTwoPlayersRaw.length; i++) {
    if (teamTwoPlayersRaw[i][0] != "") {
      players.push({name: teamTwoPlayersRaw[i][0], elo: teamTwoElosRaw[i][0], id: nextId});
      nextId *= 2;
    }
  }

  var possibleTeams = getPossibleTeams(players);
  
  // Sort teams from low to high elo difference
  possibleTeams.sort(function (a,b) {
    return a.eloDifference - b.eloDifference;
  });

  // Add possible team configurations to Team Selection sheet
  var teamSelectionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Team Selection");
  var teamOneOutputRange = teamSelectionSheet.getRange(teamOneSelOutputRange);
  var teamTwoOutputRange = teamSelectionSheet.getRange(teamTwoSelOutputRange);
  // Output 2D array needs to match range size
  var teamOneOutput = new Array(teamSelNumRows).fill("").map(() => new Array(1).fill(""));
  var teamTwoOutput = new Array(teamSelNumRows).fill("").map(() => new Array(1).fill(""));

  // Iterate through team configurations
  for (let i = 0; i < Math.min(teamSelectionNumOptions, possibleTeams.length); i++) {
    var teamConfig = possibleTeams[i];
    var baseRowOffset = teamSelectionPlayersRowOffset + i*teamSelectionOptionRowSpacing;
    // Need to append team names before
    teamOneOutput[baseRowOffset-1][0] = "Team 1 Players";
    teamTwoOutput[baseRowOffset-1][0] = "Team 2 Players";
    // Iterate through team 1 players
    for (let j = 0; j < teamConfig.teamOne.players.length; j++) {
      teamOneOutput[baseRowOffset+j][0] = teamConfig.teamOne.players[j].name;
      // Check if there is a team 2 player in the same row (not the case for odd numbered teams)
      if (j < teamConfig.teamTwo.players.length) {
        teamTwoOutput[baseRowOffset+j][0] = teamConfig.teamTwo.players[j].name;
      }
    }
    // Need to append word "Cumulative" after
    teamOneOutput[baseRowOffset+5][0] = "Cumulative";
    teamTwoOutput[baseRowOffset+5][0] = "Cumulative";
  }
  Browser.msgBox(teamOneOutput[0].length);
  teamOneOutputRange.setValues(teamOneOutput);
  teamTwoOutputRange.setValues(teamTwoOutput);

  // Prepare message as string
  Browser.msgBox("Possible team configurations have been generated.\\nGo to the Team Selection sheet to continue");
  return;
}

function selectTeams() {
  var id = Browser.inputBox('Enter the team configuration ID that you want to use');
  if (id == "cancel" || isNaN(id)) {
    return;
  }

  // Destination sheet
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  // Origin sheet
  var teamSelectionSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Team Selection");
  var teamOneNamesRange = teamOneSelOutputRange.slice(0,1) + // First cell
                          Number(Number(teamOneSelOutputRange.slice(1,3)) +
                          teamSelectionPlayersRowOffset + teamSelectionOptionRowSpacing*(Number(id)-1)) +
                          ":" + teamOneSelOutputRange.slice(0,1) + // Last cell
                          Number(Number(teamOneSelOutputRange.slice(1,3)) +
                          teamSelectionPlayersRowOffset + teamSelectionOptionRowSpacing*(Number(id)-1) + 4);
  var teamTwoNamesRange = teamTwoSelOutputRange.slice(0,1) + // First cell
                          Number(Number(teamTwoSelOutputRange.slice(1,3)) +
                          teamSelectionPlayersRowOffset + teamSelectionOptionRowSpacing*(Number(id)-1)) +
                          ":" + teamTwoSelOutputRange.slice(0,1) + // Last cell
                          Number(Number(teamTwoSelOutputRange.slice(1,3)) +
                          teamSelectionPlayersRowOffset + teamSelectionOptionRowSpacing*(Number(id)-1) + 4);
  var teamOneNames = teamSelectionSheet.getRange(teamOneNamesRange).getValues();
  var teamTwoNames = teamSelectionSheet.getRange(teamTwoNamesRange).getValues();
  addAMatchSheet.getRange(teamOnePlayersRange).setValues(teamOneNames);
  addAMatchSheet.getRange(teamTwoPlayersRange).setValues(teamTwoNames);
  
  // Clear combat scores
  clearCombatScores();

  // Clear rounds won
  clearRoundsWon();

  // Clear new elo
  clearNewElos();

  // Sort players in terms of elo
  SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(addAMatchSheet);
  addAMatchSheet.getRange('12:16').sort({column: 2, ascending: true});
  addAMatchSheet.getRange('21:25').sort({column: 2, ascending: true});
}

/**
 * @brief Balances the teams using greedy heuristic
 * @note  This function is deprecated
 */
function balanceTeams_greedy() {
  var addAMatchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Add a Match");
  // Collect tuples of (player name, player elo)
  var teamOnePlayersRaw = addAMatchSheet.getRange(teamOnePlayersRange).getValues();
  var teamOneElosRaw = addAMatchSheet.getRange(teamOneElosRange).getValues();
  var teamTwoPlayersRaw = addAMatchSheet.getRange(teamTwoPlayersRange).getValues();
  var teamTwoElosRaw = addAMatchSheet.getRange(teamTwoElosRange).getValues();
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
  if (teamOneSize >= 1) {
    addAMatchSheet.getRange(teamOnePlayerRange[0]).setValue(teamOnePlayersRaw[0]);
    if (teamOneSize >= 2) {
      addAMatchSheet.getRange(teamOnePlayerRange[1]).setValue(teamOnePlayersRaw[1]);
      if (teamOneSize >= 3) {
        addAMatchSheet.getRange(teamOnePlayerRange[2]).setValue(teamOnePlayersRaw[2]);
        if (teamOneSize >= 4) {
          addAMatchSheet.getRange(teamOnePlayerRange[3]).setValue(teamOnePlayersRaw[3]);
          if (teamOneSize == 5) {
            addAMatchSheet.getRange(teamOnePlayerRange[4]).setValue(teamOnePlayersRaw[4]);
          }
        }
      }
    }
  }
  if (teamTwoSize >= 1) {
    addAMatchSheet.getRange(teamTwoPlayerRange[0]).setValue(teamTwoPlayersRaw[0]);
    if (teamOneSize >= 2) {
      addAMatchSheet.getRange(teamTwoPlayerRange[1]).setValue(teamTwoPlayersRaw[1]);
      if (teamOneSize >= 3) {
        addAMatchSheet.getRange(teamTwoPlayerRange[2]).setValue(teamTwoPlayersRaw[2]);
        if (teamOneSize >= 4) {
          addAMatchSheet.getRange(teamTwoPlayerRange[3]).setValue(teamTwoPlayersRaw[3]);
          if (teamOneSize == 5) {
            addAMatchSheet.getRange(teamTwoPlayerRange[4]).setValue(teamTwoPlayersRaw[4]);
          }
        }
      }
    }
  }
  
  // Clear combat scores
  clearCombatScores();

  // Clear rounds won
  clearRoundsWon();

  // Clear new elo
  clearNewElos();
}