/**
 * @file library.gs
 *
 * @brief General purpose helper functions
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