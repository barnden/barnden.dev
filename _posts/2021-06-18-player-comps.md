---
layout: post
title:  "Finding Player Comps with Mahalnobis Distance"
date:   2021-06-19 14:47:00
categories: baseball stats python pandas numpy
math: true
---
[Baseball Reference](https://baseball-reference.com/) has a feature on player pages called "Similarity Scores" that quantifies how similar a player's season or career is to another. For example, [Mike Trout's](https://www.baseball-reference.com/players/t/troutmi01.shtml#all_ss_other) career to date is most similar to that of [Hack Wilson](https://www.baseball-reference.com/players/w/wilsoha01.shtml). Dan Szymborski's [ZiPS projections](https://blogs.fangraphs.com/the-2021-zips-projections-an-introduction/) uses Mahalanobis distances to find player comps, and predict their performance in the next season.

To find player comps, I will be using Mahalanobis distances like ZiPS does. The data set I will be using is the [Baseball Databank](https://github.com/chadwickbureau/baseballdatabank/tree/master/core). The data includes every player season from 1847 to 2020. For the vector space model, I will be using every basic stat as a dimension in the vector space. For batters, the dimensions are: games played, at bats, runs, hits, doubles, triples, home runs, RBI, SB, CS, strikeouts, IBB, sac hits, sac flies, and GIDP.

```py
# These are the basic stats we are keeping track of.

cols = ['G', 'AB', 'R', 'H', '2B', '3B', 'HR', 'RBI', 'SB', 'CS', 'BB', 'SO', 'IBB', 'SH', 'SF', 'GIDP']
```

The `Batting.csv` data set only includes these basic stats and preferably it would have more advanced metrics like OPS+ or wOBA that measures hits more indirectly. This way, we can build a model that takes into account the player's value rather than just taking counting stats at face value. As all the data is available to me, I should be able to calculate these statistics on my own, but that's out of the scope for this exercise.

I decided to discard any statistics from the pre-war era (pre-1945), this is because the game's rules were drastically different in its early days (1850-1890s), and the dead-ball era (1900-1920) will affect the covariance matrix. I picked post-war because it is close to the integration era that started in 1947.

```py
# Read all data
orig_data = pd.read_csv("baseballdatabank-master/core/Batting.csv")

# Keep only post-war stats
batting_data = orig_data[orig_data.yearID >= 1945]

# Copy over the statistically relevant columns
data = batting_data[cols].copy()
```

## Mahalanobis Distance

The formula for [Mahalanobis distance](https://en.wikipedia.org/wiki/Mahalanobis_distance) is

$$
d(\vec{x}, \vec{y}) = \sqrt{\left(\vec{x} - \vec{y}\right)^T\pmb{S}^{-1}\left(\vec{x} - \vec{y}\right)}
$$

Where:
- $$\vec{x}$$ and $$\vec{y}$$ are two vectors with the same distribution (i.e. the player statlines)
- $$\pmb{S}^{-1}$$ is the inverse of the [covariance matrix](https://en.wikipedia.org/wiki/Covariance_matrix)

The notion of Mahalanobis distance can be extended into $$n$$-dimensions, which is good for vector space models. This is better than using just Euclidean distance as it considers the correlations between the data.

Using `numpy`, the covariance matrix is easy to find. However, because some stats like IBB or CS were not kept until later in the game's history, some players may have an empty value; these empty values become `NaN`. Luckily, `numpy.ma` allows us to mask these invalid values.

First, `numpy.ma.masked_invalid` masks the `NaN` values, and `numpy.ma.cov` allows us to compute the covariance matrix with masked values. Using the `numpy.linalg` library, we can also compute the inverse of this matrix.
```py
# Find covariant matrix of the data, and its inverse
cov = np.ma.cov(np.ma.masked_invalid(data), rowvar=False)
invcov = np.linalg.inv(cov)
```

Then to compute the Mahalanobis distance, we simply find a player's season by their player ID and the year and compare it to all other player seasons. For example [Shohei Ohtani](https://www.baseball-reference.com/players/o/ohtansh01.shtml) has a player ID of `ohtansh01`, and we can pick his rookie 2018 season. Then, using the `distance()` function we can find the most similar season to Ohtani's.

To select a player season, we can restrict the `pandas` dataframe based on predicates:
```py
orig_data[(orig_data.playerID == pid) & (orig_data.yearID == yr)][cols]
```

The above finds a player season where both the player and year match, then makes a vector from the statistically relevant columns defined earlier.

Then, we iterate through all the player seasons, and compute the Mahalanobis distance. There is a useful function called `numpy.einsum` that allows us to use [Einstein notation](https://en.wikipedia.org/wiki/Einstein_notation) to define the matrix multiplication required to compute the distance.

```py
dist = np.sqrt(np.einsum('nj,jk,nk->n', delta, invcov, delta))[0]
```

Using the above elements, I created the `distance()` function, this computes the Mahalanobis distance from a given player to every single player season post-war. In the end, it will print out the most similar season. Using Ohtani's rookie season, we call `distance('ohtansh01', 2018)` and it yields [Willson Contreras'](https://www.baseball-reference.com/players/c/contrwi01.shtml) 2019 with a distance of 3.095.

Again, I only looked at batting data, one obvious improvement would be adding another dimension for age. This will allow me to do something like to Baseball Reference's similarity score and find most similar by age. Also, using age makes it possible to come up with past players with similar performances and use them as a model for how a current player might age, &agrave; la ZiPS.

The full implementation of the `distance()` function is as follows:

```py
def distance(pid, yr):
    # Computes the Mahalanobis distance for a given player to all other player.

    # Get player data
    player = orig_data[(orig_data.playerID == pid) & (orig_data.yearID == yr)][cols]
    sid = player.index.astype(int)[0]

    print('Comparing: {} (id: {})'.format(pid, sid))

    # Mask invalid values in the player vector
    pvec = np.ma.masked_invalid(np.array(player))

    min_player = None
    min_val = None

    for i in range(len(data)):
        # Get the ith player season
        cdata = data.iloc[i]

        # Ignore the current player season
        if cdata.name == sid:
            continue

        # Mask invalid values
        cvec = np.ma.masked_invalid(np.array(cdata))

        # Find difference between x and y
        delta = pvec - cvec

        # Find Mahalanobis distance
        dist = np.sqrt(np.einsum('nj,jk,nk->n', delta, invcov, delta))[0]

        # Check to see if current distance is smallest, if so, keep it.
        if min_id == None or min_val > dist:
            min_player = batting_data.iloc[i]
            min_val = dist

    # Print out the most similar season
    print('Most similar: dist: {}\n{}'.format(min_val, min_player))
```
