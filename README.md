# sportspredictor

## Parlay Probability Calculation

A new feature was added through `parlay.py` to support parlay betting analysis.

The file takes multiple predicted probabilities and multiplies them together to calculate the overall probability that all bets in the parlay will win. Since parlays become harder to win as more bets are added, the file also includes an optional penalty system that decreases the final probability depending on the number of legs in the parlay.

For example, if three bets have probabilities of 0.70, 0.60, and 0.80, the combined parlay probability is:

0.70 * 0.60 * 0.80 = 0.336

This feature gives the user a more realistic way to evaluate multi-leg bets instead of just viewing single-game predictions.