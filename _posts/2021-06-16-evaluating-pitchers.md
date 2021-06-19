---
layout: post
title:  "Evaluating Pitchers Using Z-Score"
date:   2021-06-16 20:20:20
categories: baseball stats python pandas numpy
math: true
---
A quick statistic to judge pitchers by is earned run average (ERA); it is the number of earned runs given up per nine innings. This is quite lacking on its own, because not all ballparks are equal. It is easier to score runs at Coors than it is at Shea, therefore, a higher ERA is to be expected from a Coors pitcher than one at Shea.

## Terminology
To account for these park biases, we use the park factor, which according to [FanGraphs](https://library.fangraphs.com/park-factors-5-year-regressed/) is:

$$
\text{PF} = \frac{R_{\text{Home}} \cdot T}{(T - 1)R_{\text{Away}}+R_{\text{Home}}}
$$

Where:
- $$R_{\text{Home}}$$ is runs scored by the park's home team
- $$R_{\text{Away}}$$ is runs scored on the road by the team
- $$T$$ is the number of teams in the league
  - Currently 15 for both AL/NL

There are some other things we can do with park factor, such as using a rolling park factor over the past calendar year, 3 years, or even 5 years. For this exercise, I used the [2020 park factors from FanGraphs](https://www.fangraphs.com/guts.aspx?type=pf&season=2020&teamid=0) over the past 3 years.

Looking at the formula for ERA, it's quickly evident that there are no adjustments being made:

$$
\text{ERA} = \frac{\text{ER} \cdot 9}{\text{IP}}
$$

Where:
- $$ER$$ is earned runs
- $$IP$$ is innings pitched

But, we can do better. Using park factors, we can adjust pitching stats to neutralize their (dis)advantages from the ballparks they play at. So, that's where ERA+ comes in:

$$
\text{ERA+} = \text{PF} \cdot \frac{\text{lgERA}}{\text{ERA}}
$$

Where:
- $$\text{lgERA}$$ is the average ERA for the league
- $$\text{lgERA}$$ is the ERA of the pitcher in question

This statistic tells how much worse the league average is in comparison to a certain pitcher; a larger ERA+ is better. With the league average being around 100, and an ERA+ of 105 meaning that the league, on average, is 5% worse than the pitcher.

ERA+ takes advantage of the park factor, so the 3-yr. rolling avg. PF for Coors is 116, and for Miller (American Family) Field the PF is 100. So two pitchers with an ERA of 4.50, one at Coors and one at Miller might seem to be the same using ERA, but with ERA+ we notice that the Coors pitcher is 16% better than the one at Miller.

Also, ERA+ can help us compare pitchers across different scoring environemnts; i.e. as of writing, Bob Gibson in 1968 had the single-season best ERA of 1.12 and an ERA- of 258, while Pedro Martinez *only* had an ERA of 1.74 in 2000 but due to the scoring environment, he blows past Gibson with an ERA- of 291.

ERA+ might be good for comparing pitchers, but it's not the best for comparing against the league. For comparing against the league, ERA- is used:

$$
\text{ERA-} = 100 \cdot \frac{\text{ERA}}{\text{lgERA}} \cdot \left(2 - \frac{\text{PF}}{100}\right)
$$

Where $$\text{ERA}$$ and $$\text{lgERA}$$ mean the same here as they did in ERA+.

Again, ERA- does take advantage of the park factor like ERA+ a 100 ERA- is average, but unlike ERA+ a lower ERA- is better. A pitcher with a 95 ERA- is 5% better than the league, on average. ERA- can also be used to compare pitchers against one another from different environments, taking Gibson's 1968 and Martinez's 2000 again: 38 vs 35.

(Before the Mets' game today on 16 June 2021, [Jacob deGrom](https://www.baseball-reference.com/players/d/degroja01.shtml) had an ERA- of 15. His ERA- will decrease after he threw 3 scoreless innings against Milwaukee, before exiting due to injury.)

## Motivation

ERA- is great for comparing players, especially if you want to compare against different eras of baseball. But, its flaw is that ERA- compares players to the league average, it does not tell you just how much *better* a pitcher is. An ERA- of 15 means that a pitcher is 85% better than league average, but that does not mean that he's better than only 85% of pitchers.

We can use Z-scores, or the number of standard deviations away from the mean, to determine how good a pitcher is.

$$
\text{ZSc} = \frac{x - \mu}{\sigma}
$$

Where:
- $$\mu$$ is the population average
- $$\sigma$$ is the standard deviation of the population

As of writing, there were 672 pitchers used during the 2021 season, more than enough to get a normal distribution of stats, which is good if we're taking standard deviation.

## Methodology

First, we need to gather all of the pitching lines for every pitcher of the 2021 season thus far; this was easy, I just had to export it from the pitching leaderboards from FanGraphs. I decided to do Z-scores against ERA-, as it already accounts for park factor and scoring environment.

Next, we remove the outliers by calculating the first and third quartiles, and calculate the inter-quartile range (IQR). We can remove anything that's more than 1.5 IQRs better than the first quartile, and 1.5 IQRs worse than the third.

Using the stripped dataset, we then calculate the stdev and mean of the ERA- distribution. After, we can use the Z-score formula to calculate just how much better $$x$$ ERA- is compared to everyone else.

Because having a below average ERA- is good, having a negative Z-score is good. So, I inverted the scale so negative Z is below the mean, and positive Z above. Also, as the scale of Z-scores are quite small, I multiplied them by 100. I am calling this Z-score statistic $$\text{zERA}$$, and its formula comes out as:

$$
\text{zERA} = -100 \cdot \frac{\text{ERA-} - \text{mean}\left(\text{lgERA-}\right)}{\text{stdev}\left(\text{lgERA-}\right)}
$$

Where:
- $$\text{ERA-}$$ is the ERA- of the pitcher
- $$\text{lgERA-}$$ is the set of ERA- of every pitcher in the league

## Results
Using the implementation described in the next section, I calculated the Z-score (zERA) and compared it against ERA/ERA+/ERA-:

| Name | Team | ERA | ERA+ | ERA- | zERA |
| :-: | :-: | :-: | :-: | :-: | :-: |
| [Jacob deGrom](https://www.baseball-reference.com/players/d/degroja01.shtml) | NYM | 0.56 | 649.67 | 15.29 | 141.69 |
| [Shohei Ohtani](https://www.baseball-reference.com/players/o/ohtansh01.shtml) | LAA | 2.85 | 149.05 | 67.09 | 56.41 |
| [Brandon Woodruff](https://www.baseball-reference.com/players/w/woodrbr01.shtml) | MIL | 1.52 | 261.66 | 38.22 | 102.53 |
| [Alex Cobb](https://www.baseball-reference.com/players/c/cobbal01.shtml) | LAA | 4.98 | 85.28 | 117.25 | -31.82 |
| Average (100 PF) | MLB | 4.10 | 100 | 100 | -0.20 |

So, deGrom has a zERA of 141.69, which means he is 1.4169 stdevs above average, or in the 
So, Jacob deGrom has a zERA of 141.69, which means he is 1.4169 standard deviations away from the mean, or he is in the 92<sup>nd</sup> percentile. As deGrom should be the best pitcher right now, he should be closer to the 99<sup>th</sup> percentile with a zERA of 200+.

A reason why deGrom is not in the 99<sup>th</sup> is that when we removed outliers, we only removed ERA- outliers. As ERA- is a rate stat, not a counting stat, pitchers will small workloads can still have an ERA- that's not an outlier in of itself. These pitchers with small workloads and that do not have an outlandish ERA- are tipping the scales. So, I removed all pitchers with a workload of fewer than 7 IP. The first quartile was 8 IP, and third was 32 IP for an IQR of 24, so technically all pitchers with 0-7 IP are not statistical outliers. But their stats in such few IP still skews the data, so I decided upon 1 IP per 10 team games as the cutoff point.

After removing pitchers with fewer than 7 IP, we get:

| Name | Team | ERA | ERA+ | ERA- | zERA |
| :-: | :-: | :-: | :-: | :-: | :-: |
| [Jacob deGrom](https://www.baseball-reference.com/players/d/degroja01.shtml) | NYM | 0.56 | 649.67 | 15.29 | 186.33 |
| [Shohei Ohtani](https://www.baseball-reference.com/players/o/ohtansh01.shtml) | LAA | 2.85 | 149.05 | 67.09 | 75.58 |
| [Brandon Woodruff](https://www.baseball-reference.com/players/w/woodrbr01.shtml) | MIL | 1.52 | 261.66 | 38.22 | 136.65 |
| [Alex Cobb](https://www.baseball-reference.com/players/c/cobbal01.shtml) | LAA | 4.98 | 85.28 | 117.25 | -33.53 |
| Average (100 PF) | MLB | 4.10 | 100 | 100 | 3.97 |

This brings deGrom's zERA up to 186.33 which is good for a 97<sup>th</sup> percentile performance thus far in the 2021 season. Which lines up with expectations, as there are 4 pitchers with min. 7 IP and better ERA- than deGrom:

| Name | Throws | Team | IP $$\geq$$ 7 | ERA- | zERA |
| :-: | :-: | :-: | :-: | :-: | :-: |
| [Anthony Bender](https://www.baseball-reference.com/players/b/bendean01.shtml) | RHRP | MIA | 17.2 | 0 | 219 |
| [Brad Wieck](https://www.baseball-reference.com/players/w/wieckbr01.shtml) | LHRP | CHC (minors) | 8 | 0 | 219 |
| [Tommy Hunter](https://www.baseball-reference.com/players/h/hunteto02.shtml) | RHRP | NYM (60IL) | 8 | 0 | 219 |
| [Caleb Baragar](https://www.baseball-reference.com/players/b/baragca01.shtml) | LHRP | SFG (minors) | 18.1 | 13 | 191 |
| [Jacob deGrom](https://www.baseball-reference.com/players/d/degroja01.shtml) | RHSP | NYM | 64 | 15 | 186 |

So 3 of the 4 guys ahead of him aren't currently on the 26 man rosters. We can increase the cutoff to 1.2 IP per 10 team games, or 11.2 IP on the season so far which, to me, is a reasonable minimum workload for a reliever 70 games into the season. Which means Wieck and Hunter drop off from the list, leaving Bender and Baragar ahead of deGrom.

| Name | Throws | Team | IP $$\geq$$ 11.2 | ERA- | zERA |
| :-: | :-: | :-: | :-: | :-: | :-: |
| [Anthony Bender](https://www.baseball-reference.com/players/b/bendean01.shtml) | RHRP | MIA | 17.2 | 0 | 232 |
| [Caleb Baragar](https://www.baseball-reference.com/players/b/baragca01.shtml) | LHRP | SFG (minors) | 18.1 | 13 | 202 |
| [Jacob deGrom](https://www.baseball-reference.com/players/d/degroja01.shtml) | RHSP | NYM | 64 | 15 | 196 |

With a 196 zERA, deGrom is in the 98<sup>th</sup> percentile of all qualified (min 11.2 IP) pitchers.

## Conclusions

As mentioned, zERA could be good to use across seasons, like to compare 1968 Gibson, 2000 Martinez, and 2021 deGrom (so far). While ERA- accounts for how much better a pitcher compared to the league, it ignores the distribution of players.

| Name | Season | IP | ERA | ERA- | zERA |
| :-: | :-: | :-: | :-: | :-: | :-: |
| [Bob Gibson](https://www.baseball-reference.com/players/g/gibsobo01.shtml) | 1968 | 304.2 | 1.12 | 38 | 232 |
| [Pedro Mart&iacute;nez](https://www.baseball-reference.com/players/m/martipe02.shtml) | 2001 | 217 | 1.74 | 35 | 243 |
| [Jacob deGrom](https://www.baseball-reference.com/players/d/degroja01.shtml) | 2021 | 64 | 0.56 | 15 | 196 |

From the above table, we see that both deGrom's ERA and ERA- blows away Gibson's and Martinez's. However, deGrom's zERA is *only* 196 which is far behind the other two. zERA shows that both Gibson and Martinez were by far the best pitchers of their respective seasons, while deGrom still has a ways to go.

deGrom's shortfall is mainly due to the fact that the 2021 season is only 70 games in, and he's being compared to the full 1968/2000 seasons. Overall pitcher quality will decrease over the course of the season as many will not be able to keep up the pace, and now with the ban on sticky substances coming into effect soon. This will further separate the elite from the average, meaning deGrom's zERA will increase (assuming he keeps up the pace).

### External Links

Initially, I got this idea from a [comment on r/baseball by u/cardith_lorda](https://old.reddit.com/r/baseball/comments/o0nhbt/h1w1ixu/). Only after doing all this did I wonder if someone else did this, and in Feb. 2009, [Rich Lederer used weighted Z-Scores to rank pitchers](http://baseballanalysts.com/archives/2009/02/using_zscores_t.php) across many categories. This was just the first result I found, surely there are many more who had this idea in the past, even Lederer mentions he got the idea from [Ryan Thibodaux](http://www.fantasybaseballcafe.com/forums/viewtopic.php?t=367175).

## Implementation

In hindsight, I could have just exported the ERA- stats from FanGraphs instead of ER/IP, and looked up league averages for AL/NL/MLB from BBRef/FanGraphs. But, it was a nice exercise in statistics after being over a year removed from my last stats class. You can view the [full python source.](https://gist.github.com/barnden/1edeec232545c49cb8c00a4c315f9687)

Using the `pandas` library, I loaded the data from FanGraphs.

```py
data = pd.read_csv(
    "data/pitching/2021-std.csv",
    converters = {
        "ER": Decimal,
        "IP": Decimal
    }
)
```

The `dtype` of ER and IP is `Decimal` for fixed-point precision, as floating-points have accuracy issues that get compounded.

Next, I created an `Inning` data type to process how IP is typically written, i.e. 1.1 IP is one and one-thirds innings pitched. So, 1.1 + 0.2 is 2.0 in IP algebra.

```py
class Inning:
    def __init__(self, val):
        if type(val) == Inning:
            self.int = val.int
            self.dec = val.dec
        else:
            self.int, self.dec = divmod(Decimal(val), Decimal(1))

    def __add__(self, other):
        if type(other) != Inning:
            other = Inning(other)

        int_sum, dec_sum = divmod((self.dec + other.dec) * 10, Decimal(3))

        return Inning(self.int + other.int + int_sum + (dec_sum / 10))

    def __mul__(self, other):
        return Inning(self.int * other)
        ps = divmod(part[1] * factor * 10, Decimal(3))

        return Inning((part[0] * factor) + ps[0] + (ps[1] / 10))

    def as_display(self):
        return Decimal(self.int + self.dec)

    def as_number(self):
        return Decimal(self.int + (self.dec * 10) / 3)

    def __str__(self):
        return str(self.as_display())
```

Because 4.5 ERA + 0.0 ERA does not mean 2.25 ERA, I also implemented an ERA type with rules for addition:

```py
class ERA:
    def __init__(self, er: Decimal, ip: Inning):
        self.er = er
        self.ip = ip

        num = ip.as_number()

        self.val = er * 9 / num if num > 0 else 0

    def __add__(self, other):
        return ERA(self.er + other.er, self.ip + other.ip)

    def as_display(self):
        return Decimal(round(self.val, 2))

    def __str__(self):
        return str(self.as_display())
```

Then, I calculate ERA for all pitchers:
```py
totals = {
    "AL": ERA(0, Inning(0)),
    "NL": ERA(0, Inning(0)),
    "MLB": ERA(0, Inning(0)),
}

for team in teams:
    league = teams[team]["league"]
    team_data = data.loc[data.Team == team].reset_index()
    teams[team]["pitchers"] = team_data

    for i in range(len(team_data)):
        totals[league] += ERA(team_data.ER[i], Inning(team_data.IP[i]))

totals["MLB"] += totals["AL"] + totals["NL"]
```

Where `teams` is a dict:
```py
teams = {
    "LAA": { "league": "AL", "park_factor": 101, "pitchers": [] },
    # ... same for the 28 other teams
    "COL": { "league": "NL", "park_factor": 116, "pitchers": [] },

    # Players for 2+ teams are listed as such
    # League averages for NL/AL will be off by some margin compared
    # FanGraphs/BBRef. But this is not statistically significant.
    "- - -": { "league": "MLB", "park_factor": 100, "pitchers": [] },
}
```

Then, we compute all the ERA- of every pitcher so far in 2021:

```py
def ERA_Minus(era: ERA, lg: ERA, PF):
    return era.val * 100 * (2 - Decimal(PF) / 100) / lg.val

# Keep track of ERA- of all pitchers in AL/NL/MLB
eram = { "AL": [], "NL": [], "MLB": [] }

# Calculate ERA- for all pitchers
for team in teams:
    league = teams[team]["league"]
    factor = teams[team]["park_factor"]
    pitchers = teams[team]["pitchers"].T

    for i in pitchers:
        eram[league].append(
            ERA_Minus(
                ERA( pitchers[i].ER, Inning(pitchers[i].IP) ),
                totals[league],
                factor
            )
        )
```

Next, we remove all outliers from the dataset, and compute the stdev and mean for each league.

```py
# Remove outliers
for league in ["AL", "NL", "MLB"]:
    eram[league] = np.array([float(x) for x in eram[league]])

    q1, q3 = np.percentile(eram[league], [25, 75])
    iqr = q3 - q1

    rmin = q1 - 1.5 * iqr
    rmax = q3 + 1.5 * iqr

    eram[league] = [ x for x in eram[league] if rmin <= x <= rmax ]

eram["MLB"] += eram["AL"] + eram["NL"]

lg_stat = {
    "AL": { "sd": stdev(eram["AL"]), "mean": mean(eram["AL"]) },
    "NL": { "sd": stdev(eram["NL"]), "mean": mean(eram["NL"]) },
    "MLB": { "sd": stdev(eram["MLB"]), "mean": mean(eram["MLB"]) }
}
```

Then, we compute the Z-score:

```py
def ZSC_ERAM(eram, lg):
    # eram is the ERA- of being compared to the league, lg.
    return (float(eram) - lg_stat[lg]["mean"]) / lg_stat[lg]["sd"] * -100
```
