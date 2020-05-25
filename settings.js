/**
* @file settings.gs
*
* @brief FPS-ELO settings and configurations are stored here
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

/* Team 1 Input Data Ranges */
var teamOneNamesRange = {strCol: "A", strRow: 12,
                         stpCol: "A", stpRow: 16,
                         toString: function() {
                           return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                         }};
var teamOneElosRange = {strCol: "B", strRow: 12,
                        stpCol: "B", stpRow: 16,
                        toString: function() {
                          return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                        }};
var teamOneCombatScoresRange = {strCol: "C", strRow: 12,
                                stpCol: "C", stpRow: 16,
                                toString: function() {
                                  return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                                }};
var teamOneRoundsWonRange = {col: "B", row: 18,
                             toString: function() {return this.col+this.row;}};

/* Team 2 Input Data Ranges */
var teamTwoNamesRange = {strCol: "A", strRow: 21,
                         stpCol: "A", stpRow: 25,
                         toString: function() {
                           return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                         }};
var teamTwoElosRange = {strCol: "B", strRow: 21,
                        stpCol: "B", stpRow: 25,
                        toString: function() {
                          return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                        }};
var teamTwoCombatScoresRange = {strCol: "C", strRow: 21,
                                stpCol: "C", stpRow: 25,
                                toString: function() {
                                  return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                                }};
var teamTwoRoundsWonRange = {col: "B", row: 27,
                             toString: function() {return this.col+this.row;}};

/* Quick View Data Ranges*/
var teamOneNewElosRange = {strCol: "B", strRow: 31,
                           stpCol: "B", stpRow: 35,
                           toString: function() {
                             return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                           }};
var teamTwoNewElosRange = {strCol: "D", strRow: 31,
                           stpCol: "D", stpRow: 35,
                           toString: function() {
                             return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                           }};

/* Team Selection Display */
var teamSelectionNumOptions = 10;
// Note: Updating numOptions does not update the surrounding user interface
var teamOneSelOutputRange = {strCol: "B", strRow: 10,
                             stpCol: "B", stpRow: 88,
                             toString: function() {
                               return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                             }};
var teamTwoSelOutputRange = {strCol: "D", strRow: 10,
                             stpCol: "D", stpRow: 88,
                             toString: function() {
                               return this.strCol+this.strRow+":"+this.stpCol+this.stpRow;
                             }};
// Note: Recommended to keep as small as possible for performance reasons
var teamSelNumRows = 79;
var teamSelectionPlayersRowOffset = 1;
var teamSelectionOptionRowSpacing = 8;

/* Elo Algorithm */
var responsibilityFactor = 11;
// Note: The higher the factor, the higher score that higher elo players are expected to score and
//       the smaller the score that lower elo players are expected to score in a given game.
//       Recommended to use 11 as the reponsibility factor for Valorant games.
var outperformThreshold = 200;
// Note: Number of combat points over expected needed to cancel out any base elo responsibility
// Ex: If a team of 5 is responsible for -25 elo change,  then each player will have a base elo
//     responsiblity of -5. If a player scores 200 combat points above expected, then they don't
//     lose any points, and can gain points despite loss

/* Match History Data Ranges */
var matchHistGameInfoCols = {timestampCol:        'A',
                             teamOneRoundsWonCol: 'AP',
                             teamTwoRoundsWonCol: 'AQ'};
var matchHistTeamOneCols = [{nameCol:        'B',  // Player 1
                             preEloCol:      'C',
                             combatScoreCol: 'D',
                             postEloCol:     'E'},
                            {nameCol:        'F',  // Player 2
                             preEloCol:      'G',
                             combatScoreCol: 'H',
                             postEloCol:     'I'},
                            {nameCol:        'J',  // Player 3
                             preEloCol:      'K',
                             combatScoreCol: 'L',
                             postEloCol:     'M'},
                            {nameCol:        'N',  // Player 4
                             preEloCol:      'O',
                             combatScoreCol: 'P',
                             postEloCol:     'Q'},
                            {nameCol:        'R',  // Player 5
                             preEloCol:      'S',
                             combatScoreCol: 'T',
                             postEloCol:     'U'}];
var matchHistTeamTwoCols = [{nameCol:        'V',  // Player 1
                             preEloCol:      'W',
                             combatScoreCol: 'X',
                             postEloCol:     'Y'},
                            {nameCol:        'Z',  // Player 2
                             preEloCol:      'AA',
                             combatScoreCol: 'AB',
                             postEloCol:     'AC'},
                            {nameCol:        'AD',  // Player 3
                             preEloCol:      'AE',
                             combatScoreCol: 'AF',
                             postEloCol:     'AG'},
                            {nameCol:        'AH',  // Player 4
                             preEloCol:      'AI',
                             combatScoreCol: 'AJ',
                             postEloCol:     'AK'},
                            {nameCol:        'AL',  // Player 5
                             preEloCol:      'AM',
                             combatScoreCol: 'AN',
                             postEloCol:     'AO'}];