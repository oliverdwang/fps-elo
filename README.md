# FPS-ELO
FPS-ELO is a Google Sheets based competitive skill tracking system that allows for simple and accurate skill tracking for custom game matches with 2 teams of up to 5 players. FPS-ELO helps friend groups of any size to find balanced teams, as well as provide relative rankings between players.

## Usage
### First Time Installation
+ Make a copy of [this google spreadsheet](https://docs.google.com/spreadsheets/d/1VSmglYXT8Rl27ORacShNgDMLUTgByTwKVMKy-Wg3EWQ/edit?usp=sharing).
  + To see what the spreadsheet looks like after a few games, go to `File\Version history\See version history`, and click on the oldest version
+ For each player to track within FPS-ELO, open the `Players` sheet and in a new row:
  + Add their IGN to column B,
  + Set the ELO in column C to 1000,
  + Add their actual name can also be added to Column A if desired
    + This is purely for user reference, and is not ingested into any of the code
  + Note: This can be done at any point, even after a few games have been played
+ If desired, modify the skill rating algorithm parameters
  + Go to `Tools\Script editor`, and navigate to the `settings.gs` file
  + Most of the settings are references to where data is taken in or outputted. To change the skill rating algorithm, go to the `Elo Algorithm` section, and modify `responsibilityFactor` and `outperformThreshold`.
    + To understand how these variables affect the skill rating algorithm, see the FAQ section on "What skill tracking algorithm is being used?"
    + For Valorant gameplay, the default settings of `responsibilityFactor=11` and `outperformThreshold=200` is ideal (from my experience)
+ To play a game, go to the `Add a Match` and follow the instructions on the top of the page
  + The first time that you click any of the buttons, Google sheets will prompt "Authorization Required". You can continue by clicking `Continue`, then in the "This app isn't verified" page click `Advanced`, then `Go to FPS-ELO (unsafe)`. If you would like to verify that the code is safe, feel free to do so by going to `Tools\Script editor` and going through the code.
+ If you accidentally record an incorrect match, you can go to the `Add a Match` page and find the `Revert Game` button. Alternatively, you can manually fix the history by manually parisng the last row of the `Match History` sheet to the `Players` sheet, and deleting the row afterwards

After clicking `Update ELO`, the new Elo will be updated automatically, and the `Match History` sheet will show the new match results.

### Updating the Code
Occasionally, I'll send push a significant update. You can find the githash of your FPS-ELO copy by going to the `Add a Match` sheet and going to the last nonempty row. When the githash of the template spreadsheet (currently `5a7311c`) is different from your copy, you can update your spreadsheet without losing your data
+ Follow the First Time Installation instructions again
+ Copy all the player data in the `Players` sheet range `A2:C99` from the old spreadsheet to the new spreadsheet
+ Copy all of the match history in the `Match History` sheet range `A2:AQ99` from the old spreadsheet to the new spreadsheet
  + The actual range may vary depending on how many games are recorded, but the idea is to copy all of the filled cells in the sheet

You are now ready to resume using FPS-ELO

## FAQ
+ ***How many games played does it take to expect a reasonable Elo estimate for a player?***

Generally, with the correct rating system parameters for your desired game, each player only needs to play around 5 games in order to be placed at a reasonable Elo level relative to others who have also played 5 games. In addition, the more balanced these games are, the faster the rating system will place players in the correct Elo. **However,**  FPS-ELO does take into account large Elo differences between teams when deciding how much Elo each player gains or loses.

+ ***Does this support teams with less than 5 people?***

FPS-ELO should work with teams smaller than 5 people, and even with teams of different sizes (e.g. 5 players versus 4 players). However, I have not extensively tested and verified this, and thus make no guarantees for teams smaller than 5 players in the current state of the project.

+ ***What skill tracking algorithm is being used?***

FPS-ELO is based off of the Elo rating system, but has significant changes and improvements to adapt the algorithm better for multiplayer team-based games. Notably, FPS-ELO takes into consideration of game decisiveness, individual player performance, and lack of exact ranking precision between players of similar Elo.

Game decisiveness is taken into account by varying the *k-factor* of a match's Elo redistribution. The k-factor essentially scales how much a single team can win, and how much the other team can lose. FPS-ELO uses a small k-factor when both teams have a similar number of matches won (or any aribtrary statistic), and a much larger k-factor when one team wins or loses by a landslide.

Individual player performance is also factored into how the rating system distributes points. Before each game, the rating system determines the parameters defining the distribution of the entire population of tracked players (by assuming the distribution of player skill is gaussian in nature). The rating system then determines the percentile that a player is at, and computes the expected individual score metric (generalized to "Combat Score") for every player. After the game is over, the rating algorithm compares the actual individual score metric to the expected score metric, and divides the team Elo responsibility (how much Elo a team gains and how much Elo the other team loses) appropriately. Therefore, if you perform worse than what is expected of someone at your Elo rating (relative to every other player on your team), then you will either lose more Elo than some of your teammates if your team loses, or gain less Elo than some of your teammates if your team wins. Within this calculation are 2 variables: the *responsibility factor*, otherwise known as the *r-factor*, and the *outperform threshold* (which will be abbreviated to *OPT*). The r-factor scales how much a player at a certain Elo is expected to perform/what percentage of the individual score metric from what everyone on the team scores. The higher the r-factor, the more a high Elo player is expected to outfrag and the less a low Elo player is expected to frag. The OPT scales how much a deviation from your expected score metric will effect your Elo responsibility out of your team's Elo responsibility. For example, if the OPT is set to 200, then you would need to score 200 higher than your expected combat score to **not** lose any Elo if your team loses, or you would need to score 200 lower than your expected combat score to not gain any Elo if your team wins.

The lack of ranking precision is factored in by the balancing algorithm, not the rating system, of FPS-ELO. If auto balancing is desired, FPS-ELO will find the top 10 most balanced team configurations, and allow a user to select which of these team configurations to use. This allows the user, who may have a better (and Elo independent) idea for general team balancing, to also have input in selecting balanced teams.

+ ***Is this skill rating system exploit proof?***

FPS-ELO simplifies the skill rating system used by mainstream multiplayer games to make it easier to adapt and use, and thus inherently has exploits that players can use to nudge their Elo up. However, FPS-ELO was designed for custom games with a relatively stable friend group, and thus in its intended use case, it is not expected that players will try to find flaws in the rating system, and rather use FPS-ELO as a balancing tool or rankings for fun. 

That being said, the formula used does not provide significant oppurtunities to exploit, especially with well tuned rating system parameters. The only significant exploit is the linearization of certain nonlinear statistics (and vice-versa), but the difference between the approximate model and actual model play a miniscle part of the overall ranking system.

+ ***Where can I leave suggestions, bug reports, and other feedback?***

Feel free to leave suggestions, improvements, bug reports, and any other feedback in the Github issue tracker. I will attempt to address feedback, but I will most likely not be able to implement changes immediately for larger problems 

+ ***How can I contribute to this project?***

Feel free to clone the reponsitory and try adding features and improvements. If there are significant improvements, I'll gladly merge pull requests. Alternatively, feel free to use FPS-ELO to create other works. I only ask that you follow the GNU aGPL license terms, and provide attribution to FPS-ELO. Thanks!
