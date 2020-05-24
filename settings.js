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
var teamOnePlayersRange = "A12:A16";
var teamOneElosRange = "B12:B16";
var teamOneCombatScoresRange = "C12:C16";
var teamOneRoundsWonRange = "B18";
var teamOnePlayerRange = ["A12","A13","A14","A15","A16"];
// Note: teamOnePlayerRange is just teamOnePlayersRange but explicitly states each cell in an array

/* Team 2 Input Data Ranges */
var teamTwoPlayersRange = "A21:A25";
var teamTwoElosRange = "B21:B25";
var teamTwoCombatScoresRange = "C21:C25";
var teamTwoRoundsWonRange = "B27";
var teamTwoPlayerRange = ["A21","A22","A23","A24","A25"];
// Note: teamTwoPlayerRange is just teamTwoPlayersRange but explicitly states each cell in an array

/* Quick View Data Ranges*/
var teamOneNewElosRange = ["B31","B32","B33","B34","B35"];
var teamTwoNewElosRange = ["D31","D32","D33","D34","D35"];

/* Team Selection Display */
var teamSelectionNumOptions = 10;
// Note: Updating numOptions does not update the surrounding user interface
var teamSelectionOutputRange = "B11:D87"
// Note: Recommended to keep as small as possible for performance reasons
var teamSelNumRows = 77;
var teamSelNumCols = 3;
var teamSelectionPlayersRowOffset = 0;
var teamSelectionTeamOnePlayersColOffset = 0;
// Note: Location of first team 1 player input, relative to top left cell in teamSelectionOutputRange
var teamSelectionTeamTwoPlayersColOffset = 2;
// Note: Location of first team 2 player input, relative to top left cell in teamSelectionOutputRange
var teamSelectionOptionRowSpacing = 8;