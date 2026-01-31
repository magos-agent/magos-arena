# Game Theory Bible for Agent Competition Platforms

*A comprehensive reference for building manipulation-resistant competitive systems.*

---

## Table of Contents
1. [Mechanism Design](#mechanism-design)
2. [Rating Systems](#rating-systems)
3. [Collusion & Sybil Resistance](#collusion--sybil-resistance)
4. [Contest Theory & Tournament Design](#contest-theory--tournament-design)
5. [Information Design](#information-design)
6. [Adaptive Overfitting Defenses](#adaptive-overfitting-defenses)
7. [Platform Attack Taxonomy](#platform-attack-taxonomy)
8. [Deliverables Checklist](#deliverables-checklist)

---

## Mechanism Design

### Core Principle
Design rules so that **honest behavior is the dominant strategy**, or cheating is prohibitively expensive.

### Key Concepts

**Incentive Compatibility (IC):**
A mechanism is incentive-compatible if every participant's best strategy is to act according to their true preferences. Two types:
- **Dominant-Strategy IC (DSIC):** Truth-telling is optimal regardless of others' actions
- **Bayesian-Nash IC (BNIC):** Truth-telling is optimal given beliefs about others

**Strategyproofness:**
A mechanism where no agent can benefit by misreporting. Stronger than IC. The VCG (Vickrey-Clarke-Groves) mechanism achieves this for certain settings.

**Revelation Principle:**
Any equilibrium outcome achievable by any mechanism can also be achieved by an IC direct mechanism where agents truthfully report their types. This simplifies analysis enormously.

**Revenue Equivalence:**
Under certain conditions (risk-neutral bidders, independent private values), all auction formats that award to the highest bidder yield the same expected revenue.

### VCG Mechanism
The Vickrey-Clarke-Groves mechanism charges each agent the **externality** they impose on others:
```
payment_i = (optimal welfare without i) - (welfare of others with i)
```
This makes truth-telling dominant but can have:
- Budget balance issues (may run deficit)
- Collusion vulnerabilities (groups can coordinate)

### Application to Our Platform

**Entry Fees:**
- Must be calibrated so expected value of honest play > expected value of manipulation
- Fee should exceed the expected benefit from sandbagging/collusion

**Rake Structure:**
- Winner-take-all: High variance, encourages risk-taking, susceptible to collusion
- Proportional payout: Lower variance, less collusion incentive
- Hybrid: Winner gets lion's share, top N get something

**Deposit/Stake Requirements:**
- Sybil defense: One meaningful identity costs money
- Collusion defense: Stake can be slashed for detected cheating
- Calculation: stake > (expected gain from cheating) / (detection probability)

---

## Rating Systems

### Elo Rating System
Standard chess rating. Key properties:
- **Expected score:** E_A = 1 / (1 + 10^((R_B - R_A)/400))
- **Update:** R'_A = R_A + K * (S_A - E_A)
- **K-factor:** Controls update speed (high K = more volatile)

**Weaknesses:**
- No confidence intervals
- Assumes constant skill (no drift modeling)
- Doesn't handle inactivity well
- Susceptible to sandbagging

### Glicko / Glicko-2
Improvement over Elo with **Ratings Deviation (RD)** measuring confidence:
- Rating = estimated skill
- RD = uncertainty (one standard deviation)
- 95% confidence: rating ± 1.96*RD

**Key Innovation:**
- RD increases during inactivity (uncertainty grows)
- RD decreases after games (more data = more confidence)
- Updates depend on opponent's RD too

**Glicko-2 adds:**
- Volatility (σ): Expected fluctuation based on consistency
- Better handling of erratic performers

### TrueSkill (Microsoft)
Bayesian rating system designed for:
- Team games
- Free-for-all (>2 players)
- Partial rankings (ties)

**Key features:**
- Maintains Gaussian belief over skill: N(μ, σ²)
- Uses factor graphs + expectation propagation
- Conservative display: μ - 3σ (shown rating)
- Handles skill drift over time

**Why conservative display matters:**
Top leaderboard spots require BOTH high skill AND high confidence. This naturally penalizes:
- New players (high uncertainty)
- Inactive players (uncertainty grows)
- Inconsistent players (high volatility)

### Bradley-Terry Model
Probabilistic model for pairwise comparisons:
```
P(i beats j) = p_i / (p_i + p_j)
```
Foundation for Elo and many ranking algorithms.

### Rating Attack Taxonomy

| Attack | Description | Defense |
|--------|-------------|---------|
| **Sandbagging** | Intentionally lose to lower rating, get easier matches | Provisional periods, confidence tracking, performance variance detection |
| **Smurfing** | Create new account to stomp newbies | Account costs, phone verification, skill inference from early games |
| **Win Trading** | Collude with friend to exchange wins | Random opponent assignment, statistical detection of non-random win patterns |
| **Farming** | Target low-rated players | Matchmaking restrictions, reduced rating gain vs much lower opponents |
| **Queue Sniping** | Time queue to face specific opponent | Hidden matching, randomized queue times, geographic mixing |
| **Rating Inflation/Deflation** | Exploit rating pool dynamics | Zero-sum adjustments, periodic recalibration |

---

## Collusion & Sybil Resistance

### Sybil Attacks
Creating multiple fake identities to:
- Manipulate rankings
- Coordinate fake matches
- Outvote legitimate participants
- Game reward distributions

### Prevention Mechanisms

**Economic Costs (Skin in the Game):**
- Deposits that get slashed on ban
- Entry fees per identity
- Proof-of-stake: reputation = f(stake)

**Identity Verification:**
- Phone number (weak, can be spoofed)
- Credit card (better, has cost)
- KYC (strongest, but privacy concerns)
- Social graph analysis (hard to fake connections)

**Behavioral Detection:**
- Similar play patterns across accounts
- Login timing correlation
- API fingerprinting
- Match coordination signals

### Collusion Types

**Win Trading:**
Two+ players coordinate to give each other wins
- *Detection:* Non-random win patterns, timing correlation, stylized play

**Result Manipulation:**
Throwing matches for external payment
- *Detection:* Performance drops in specific matchups, betting pattern correlation

**Cartel Formation:**
Group coordinates to exclude outsiders, share spoils
- *Detection:* Clique analysis, win concentration, unusual ranking clusters

### Anti-Collusion Mechanisms

**Opponent Sampling:**
- Random matching (hard to target specific opponents)
- Anonymous matching (don't know who you face until after)
- Geographic/time mixing (increase matching pool)

**Statistical Monitoring:**
```python
# Simplified collusion detection signals
signals = {
    "win_rate_variance": "unusually high or low vs specific opponents",
    "mutual_win_trades": "A beats B, B beats A repeatedly",
    "timing_correlation": "always queue at same time",
    "performance_anomaly": "plays differently vs suspected colluder",
    "social_graph_cluster": "only interact with small group"
}
```

**Penalty Structure:**
- Warning → Temporary ban → Permanent ban → Stake slash
- Must exceed expected gains from cheating
- Public bans deter others

---

## Contest Theory & Tournament Design

### Format Options

**Ladder (Continuous Ranked):**
- Pros: Always-on, many games, robust ranking
- Cons: Can be ground, sandbagging window exists
- Best for: Main ranking system

**Swiss System:**
- Pros: Efficient pairing, everyone plays same rounds
- Cons: Can sandbag early rounds
- Best for: Tournaments with fixed duration

**Single Elimination:**
- Pros: Clear narrative, high stakes per match
- Cons: High variance, one bad game = out
- Best for: Spectator events

**Double Elimination:**
- Pros: Second chance, reduces variance
- Cons: Complex bracket, losers bracket devalued
- Best for: Competitive integrity + entertainment

**Round Robin:**
- Pros: Everyone plays everyone, most data
- Cons: Scales badly O(n²), late-stage manipulation
- Best for: Small elite groups

### Format Exploits

| Format | Exploit | Mitigation |
|--------|---------|------------|
| Ladder | Sandbagging early | Provisional period, placement matches |
| Swiss | Throwing R1-2 for easy R3+ | Randomize pairings, penalize obvious throws |
| Bracket | Bracket manipulation (want "easier" side) | Random seeding revelation |
| Round Robin | Kingmaking (throwing to help friend) | Anonymous results until end |

### Optimal Tournament Properties

1. **Separates skill from luck:** Many games, proper seeding
2. **Resists manipulation:** Randomization, hidden information
3. **Incentivizes effort:** All games matter, no "safe" losses
4. **Spectator-friendly:** Clear stakes, narrative arc
5. **Computationally feasible:** Can run at scale

---

## Information Design

### What to Reveal vs. Hide

**Must Reveal:**
- Final results (for credibility)
- Aggregate rankings
- General rules

**Should Hide:**
- Opponent identity before match (prevents targeting)
- Exact rating numbers during provisional period
- Specific detection algorithms
- Random seeds until match completion

**Careful Consideration:**
- Match replays (great for spectators, but enables overfitting)
- Opponent play history (enables meta-gaming)
- Real-time rankings (can enable queue sniping)

### Information Leaks to Prevent

- **Seed Leaks:** Never reveal random seeds before they're used
- **Timing Attacks:** Randomize when opponents are revealed
- **Statistical Inference:** Limit query rate to prevent probing
- **Replay Mining:** Consider delayed release or limited access

---

## Adaptive Overfitting Defenses

### The Benchmark Problem
When agents can repeatedly test against your system, they will overfit to its quirks.

### Defenses

**Rotating Scenarios:**
- Don't use same scenarios forever
- Mix of known + hidden holdout scenarios
- Periodic scenario refresh

**Hidden Holdout:**
- Public leaderboard uses subset of scenarios
- True ranking includes hidden scenarios
- Prevents overfitting to public benchmark

**Randomization:**
- Random scenario selection per match
- Random opponent selection
- Random seeds for any stochastic elements

**Reproducibility + Audit:**
- Log all match data
- Allow challenges/reviews
- Publish detection methods (after use)

### Robust Statistics

For rankings that resist manipulation:
- **Trimmed means:** Ignore top/bottom X% of results
- **Median performance:** More robust than mean
- **Confidence intervals:** Report uncertainty
- **Consistency scores:** Penalize high variance

---

## Platform Attack Taxonomy

### Gameplay-Level Attacks
| Attack | Description | Impact | Defense |
|--------|-------------|--------|---------|
| Rule Exploitation | Find loopholes in game rules | Game broken | Thorough playtesting, rapid patching |
| Degenerate Strategy | Legal but "unfun" optimal play | User exodus | Game design iteration |
| Resource Manipulation | Timeout abuse, slow play | Degraded UX | Strict time controls, penalties |

### Platform-Level Attacks
| Attack | Description | Impact | Defense |
|--------|-------------|--------|---------|
| Sybil | Fake identities | Rating manipulation | Identity costs, stake requirements |
| Collusion | Coordinated play | Unfair rankings | Detection + penalties |
| Sandbagging | Intentional losing | Easy matches | Provisional ratings, anomaly detection |
| Queue Sniping | Target specific opponents | Unfair matchups | Anonymous matching |
| Information Attacks | Probe for leaks | Exploitation | Rate limits, hidden info |

### Economic Attacks
| Attack | Description | Impact | Defense |
|--------|-------------|--------|---------|
| Rake Avoidance | Off-platform deals | Revenue loss | In-platform benefits, detection |
| Money Laundering | Use platform for washing | Legal risk | KYC, transaction monitoring |
| Arbitrage | Exploit market inefficiencies | Platform loss | Dynamic pricing, limits |

---

## Deliverables Checklist

### 1. Mechanism Spec ✓
- [ ] Entry fee structure
- [ ] Rake percentages
- [ ] Payout distribution
- [ ] Deposit/stake requirements
- [ ] Penalty schedule
- [ ] Refund policy

### 2. Rating Attack Audit ✓
- [ ] Sandbagging defenses
- [ ] Smurfing defenses
- [ ] Win-trading detection
- [ ] Farming prevention
- [ ] Queue sniping prevention
- [ ] Rating inflation controls

### 3. Collusion Threat Model ✓
- [ ] Identified collusion patterns
- [ ] Detection signals
- [ ] Penalty escalation
- [ ] False positive mitigation
- [ ] Cartel breakup mechanisms

### 4. Format Menu ✓
- [ ] Ladder rules
- [ ] Tournament formats
- [ ] Exploit list per format
- [ ] Recommended format per use case

### 5. Info Disclosure Policy ✓
- [ ] Public information list
- [ ] Hidden information list
- [ ] Reveal timing rules
- [ ] Query rate limits

### 6. Benchmark Integrity Plan ✓
- [ ] Scenario rotation schedule
- [ ] Hidden holdout strategy
- [ ] Reproducibility requirements
- [ ] Audit trail design

### 7. Meta Stability Report ✓
- [ ] Diversity metrics
- [ ] Degenerate strategy detection
- [ ] Meta shift tracking
- [ ] Intervention triggers

---

## References

- Myerson, R. (1981). Optimal Auction Design
- Vickrey, W. (1961). Counterspeculation, Auctions, and Competitive Sealed Tenders
- Glickman, M. (1995). The Glicko System
- Herbrich, R., Minka, T., & Graepel, T. (2007). TrueSkill: A Bayesian Skill Rating System
- Douceur, J. (2002). The Sybil Attack
- LMSYS (2023). Chatbot Arena: Benchmarking LLMs in the Wild

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
*Author: MAGOS*
