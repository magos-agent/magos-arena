# Rating Attack Audit

A comprehensive analysis of competitive rating systems, their vulnerabilities, and defense mechanisms.

---

## Table of Contents

1. [Rating Systems Overview](#1-rating-systems-overview)
2. [Attack Taxonomy](#2-attack-taxonomy)
3. [System-Specific Vulnerabilities](#3-system-specific-vulnerabilities)
4. [Defense Mechanisms](#4-defense-mechanisms)
5. [Comparative Analysis](#5-comparative-analysis)
6. [Recommendations](#6-recommendations)

---

## 1. Rating Systems Overview

### 1.1 Elo Rating System

**Origin:** Developed by Arpad Elo for chess (FIDE adopted 1970)

**Core Formula:**
```
Expected Score: E_A = 1 / (1 + 10^((R_B - R_A) / 400))
Rating Update:  R'_A = R_A + K × (S_A - E_A)
```

**Key Parameters:**
- **K-factor:** Controls rating volatility (typically 10-40)
- **Starting Rating:** Usually 1200-1500
- **No confidence tracking:** All ratings treated equally

**Strengths:**
- Simple, interpretable
- Well-understood mathematically
- Easy to implement

**Weaknesses:**
- No uncertainty modeling
- Assumes stable skill levels
- K-factor is a blunt instrument
- Zero-sum: exploitable via opponent selection

---

### 1.2 Glicko Rating System

**Origin:** Mark Glickman (1995), designed to address Elo limitations

**Core Innovations:**
- **Rating Deviation (RD):** Measures rating uncertainty (typically 30-350)
- **RD increases over inactivity:** Captures skill uncertainty from absence
- **Variable K-factor equivalent:** Based on opponent's RD

**Formulas:**
```
q = ln(10) / 400 ≈ 0.00575646
g(RD) = 1 / √(1 + 3q²RD² / π²)

Expected Score:
E(μ, μ_j, RD_j) = 1 / (1 + 10^(-g(RD_j)(μ - μ_j) / 400))

Rating Update:
μ' = μ + q / (1/RD² + 1/d²) × Σ g(RD_j)(s_j - E_j)
```

**RD Behavior:**
- Minimum RD: ~30 (very confident)
- Maximum RD: ~350 (highly uncertain)
- RD grows during inactivity via: `RD' = min(√(RD² + c²), 350)`

---

### 1.3 Glicko-2 Rating System

**Origin:** Mark Glickman (2001), evolution of Glicko

**Key Addition: Rating Volatility (σ)**
- Third parameter tracking rating *stability*
- High σ = player's skill fluctuates
- Low σ = consistent performance

**System Parameters:**
- **τ (tau):** System constant controlling volatility change (typically 0.3-1.2)
- **ε (epsilon):** Convergence tolerance (typically 0.000001)

**Three-Parameter Model:**
| Parameter | Symbol | Typical Range | Meaning |
|-----------|--------|---------------|---------|
| Rating | μ | 0-3000 (Glicko scale: 1500 start) | Skill estimate |
| Deviation | φ (phi) | 0.06-2.0 (Glicko-2 scale) | Uncertainty |
| Volatility | σ | 0.03-0.1 | Consistency |

**Update Process:**
1. Compute variance `v` based on opponents
2. Compute improvement `Δ` 
3. Iteratively solve for new σ (requires numerical methods)
4. Update φ* and then φ'
5. Calculate new μ'

**Conversion to Glicko-1 scale:**
```
μ_Glicko1 = 173.7178 × μ_Glicko2 + 1500
RD_Glicko1 = 173.7178 × φ_Glicko2
```

---

### 1.4 TrueSkill™ Rating System

**Origin:** Microsoft Research (2006), designed for Xbox Live

**Core Model:** Bayesian inference with factor graphs

**Two Parameters:**
- **μ (mu):** Mean skill estimate
- **σ (sigma):** Skill uncertainty

**Key Innovations:**
- **Team support:** Handles multi-player teams natively
- **Partial play:** Supports players joining/leaving
- **Draw modeling:** Explicit draw probability parameter
- **Update via message passing:** Belief propagation in factor graphs

**Default Parameters (Xbox Live):**
| Parameter | Default | Purpose |
|-----------|---------|---------|
| μ₀ | 25 | Initial mean |
| σ₀ | 25/3 ≈ 8.33 | Initial uncertainty |
| β | 25/6 ≈ 4.17 | Performance variance |
| τ | 25/300 ≈ 0.083 | Dynamics factor |
| Draw probability | Game-specific | Likelihood of ties |

**Conservative Skill Estimate:**
```
Display Rating = μ - 3σ
```
This is what players see—represents ~99% lower bound.

**Matchmaking Quality:**
```
Quality = √(n × β² / (n × β² + Σσᵢ²)) × exp(-Δμ² / (2(n × β² + Σσᵢ²)))
```

---

### 1.5 Bradley-Terry Model

**Origin:** Ralph Bradley & Milton Terry (1952)

**Foundation:** Probabilistic pairwise comparison model

**Core Assumption:**
```
P(i beats j) = πᵢ / (πᵢ + πⱼ)

Where πᵢ > 0 are "worth" parameters
Equivalently with ratings: P(i beats j) = 1 / (1 + e^(-(rᵢ - rⱼ)))
```

**Key Properties:**
- **Logistic model:** Elo is essentially Bradley-Terry
- **Maximum Likelihood Estimation:** Standard fitting approach
- **No draw modeling:** Base model assumes decisive outcomes
- **Extensible:** Many variants exist (ties, home advantage, covariates)

**Extensions:**
- **Bradley-Terry-Luce:** Adds choice theory interpretation
- **Thurstone-Mosteller:** Uses normal distribution instead of logistic
- **Plackett-Luce:** Extends to rankings over multiple items

---

## 2. Attack Taxonomy

### 2.1 Sandbagging

**Definition:** Intentionally losing to lower one's rating, then winning at artificially low rating.

**Mechanism:**
1. Player deliberately loses games/matches
2. Rating drops significantly below true skill
3. Player competes seriously against weaker opponents
4. Easy wins, potentially for prizes/recognition at lower levels

**Motivations:**
- Tournament prizes in lower divisions
- Ego satisfaction from dominating
- Achievement hunting
- Creating "smurf" accounts organically

**Detection Signals:**
| Signal | Description |
|--------|-------------|
| Loss clustering | Many losses in short period, then improvement |
| Skill discontinuity | Sudden jump in performance |
| Opponent selection | Choosing clearly superior opponents to lose to |
| Time manipulation | Deliberately timing out or resigning early |
| Low accuracy followed by high | Chess engines can detect deliberate misplays |

---

### 2.2 Smurfing

**Definition:** Creating new account to compete at lower ratings with new identity.

**Mechanism:**
1. Experienced player creates fresh account
2. Starts at default/provisional rating (much lower than true skill)
3. Dominates early matches until rating catches up
4. May abandon account once rating normalizes

**Variants:**
- **Serial smurfing:** Creating many accounts sequentially
- **Rating parking:** Maintaining alt at specific rating
- **Boosting vehicles:** Accounts used to boost others

**Impact Assessment:**
| Affected Group | Impact Severity | Description |
|----------------|-----------------|-------------|
| New players | Critical | Discouraging losses against "newbies" |
| Low-rated players | High | Unfair matches, rating deflation |
| System integrity | Medium | Inflated match counts, polluted statistics |
| High-rated players | Low | Lose opponents, but rating preserved |

---

### 2.3 Win Trading

**Definition:** Collusion between accounts/players to transfer rating points.

**Mechanism:**
1. Two or more accounts coordinate
2. One account deliberately loses to the other
3. Rating points transfer from loser to winner
4. May reverse roles or use multiple alts

**Types:**
| Type | Description | Detection Difficulty |
|------|-------------|---------------------|
| Self-trading | Same person, multiple accounts | Medium (IP/device) |
| Duo trading | Two people, mutual agreement | Hard |
| Ring trading | Multiple participants, complex patterns | Very Hard |
| Paid boosting | Financial transaction, service | Requires external intel |

**Characteristics:**
- Often occurs at off-peak hours
- Unusual game completion patterns (very short games)
- Repeated pairings between same accounts
- Geographic/temporal correlation between accounts

---

### 2.4 Newbie Farming

**Definition:** Deliberately seeking matches against new/inexperienced players.

**Mechanism:**
1. Identify characteristics of new player accounts
2. Target matchmaking to encounter them
3. Accumulate easy wins against provisional players

**Why It Works:**
- New players have high uncertainty (RD/σ)
- Beating high-uncertainty players gains more rating
- New players can't distinguish skill disparity
- Matchmaking often prioritizes speed over accuracy for new players

**Exploitation Vectors:**
- Playing at "new player" times (evenings, weekends)
- Server/region selection for fresh populations
- Queue sniping (timing queue entry)
- Exploiting provisional rating periods

---

### 2.5 Rating Inflation/Deflation Attacks

**Definition:** Systematic manipulation of the rating pool's average.

**Inflation Mechanisms:**
- New players enter, lose, leave (donate points)
- Point generation from outside system
- Asymmetric gain/loss calculations

**Deflation Mechanisms:**
- Point removal when accounts leave
- Decay without redistribution
- Cheater removal taking points with them

**System-Level Impacts:**
| Effect | Description |
|--------|-------------|
| Historical comparison | Ratings non-comparable across eras |
| Percentile drift | Same percentile = different skill over time |
| Anchor instability | "1500 = average" becomes meaningless |

---

### 2.6 Matchmaking Manipulation

**Definition:** Exploiting matchmaking algorithms for favorable pairings.

**Techniques:**
| Technique | Description |
|-----------|-------------|
| Queue timing | Enter queue when target opponent likely searching |
| Region abuse | Connect to regions with weaker players |
| Time zone exploitation | Play when casual players active |
| Lobby sniping | Join specific custom lobbies |
| Duo queue abuse | Team with lower-rated friend for easier matches |

---

## 3. System-Specific Vulnerabilities

### 3.1 Elo Vulnerabilities

| Vulnerability | Severity | Exploitability | Description |
|--------------|----------|----------------|-------------|
| Fixed K-factor | High | Easy | No adaptation to player certainty |
| No provisional period | High | Easy | Smurfs immediately affect rating pool |
| Zero-sum exploit | Medium | Medium | Opponent selection directly manipulates rating |
| No inactivity decay | Medium | Easy | Abandoned accounts pollute pool |
| Historical blindness | Low | Hard | Can't detect anomalous patterns |

**Specific Attack: K-Factor Exploitation**
- New accounts often have higher K-factor
- Win-trade with new account for amplified gains
- Losses to established accounts cost less

---

### 3.2 Glicko/Glicko-2 Vulnerabilities

| Vulnerability | Severity | Exploitability | Description |
|--------------|----------|----------------|-------------|
| RD inflation abuse | High | Medium | Stop playing to increase RD, then perform |
| Period boundary gaming | Medium | Medium | Time games around rating period updates |
| Volatility manipulation (G2) | Medium | Hard | Erratic play to increase σ, then stabilize |
| Provisional farming | High | Easy | Target high-RD players for bigger gains |

**Specific Attack: RD Pumping**
1. Play enough to establish decent rating
2. Go inactive, let RD climb
3. Return and win a few games
4. High RD means massive rating gains per win
5. Repeat

**Glicko-2 Volatility Attack:**
1. Alternate between trying hard and throwing games
2. σ increases (system thinks skill is unstable)
3. When σ is high, good performance → larger rating jumps
4. More responsive to sandbagging recovery

---

### 3.3 TrueSkill Vulnerabilities

| Vulnerability | Severity | Exploitability | Description |
|--------------|----------|----------------|-------------|
| Team rating exploitation | High | Medium | Skilled player + low-rated teammates = easy games |
| Sigma starvation | Medium | Easy | Old accounts become rating-locked |
| Partial play abuse | Medium | Game-specific | Join late/leave early for favorable calculations |
| Draw manipulation | Low | Hard | In games with draws, force draws for σ reduction |

**Specific Attack: Team Stacking**
1. High-skill player queues with low-rated friends
2. Matchmaking targets team's average skill
3. High-skill player carries against inferior opponents
4. Low-rated players absorb rating losses, high player gains

**Sigma Floor Problem:**
- Long-time players have very low σ
- Even big skill changes barely move rating
- Incentivizes account abandonment/smurfing

---

### 3.4 Bradley-Terry Vulnerabilities

| Vulnerability | Severity | Exploitability | Description |
|--------------|----------|----------------|-------------|
| No time component | High | Easy | Historical results weighted equally |
| Batch update sensitivity | Medium | Medium | Strategic timing of reported results |
| Comparison set manipulation | Medium | Hard | Control who you're compared against |
| No uncertainty modeling | High | Easy | All estimates treated with equal confidence |

---

## 4. Defense Mechanisms

### 4.1 Provisional Rating Systems

**Concept:** New accounts treated differently until sufficient games played.

**Implementation Approaches:**
| Approach | Description | Systems |
|----------|-------------|---------|
| Hidden rating | Don't show rating until X games | Chess.com |
| High K-factor | Larger adjustments early | FIDE Elo |
| High RD/σ | Built into Glicko/TrueSkill | Standard |
| Placement matches | Calibration games before ranking | League of Legends |
| Rating floor | Can't drop below threshold early | Lichess |

**Lichess Example:**
- Provisional marker "?" until RD < 110
- Rating deviation starts at 350
- Takes ~10-15 games to become established

---

### 4.2 Confidence Intervals

**Purpose:** Quantify uncertainty in skill estimates.

**Glicko RD Interpretation:**
```
95% confidence: μ ± 1.96 × RD
"Rating is between X and Y with 95% confidence"
```

**TrueSkill Display:**
```
Conservative estimate: μ - 3σ
Shown to players as "skill rating"
True skill above this 99.7% of the time
```

**Applications:**
- Matchmaking: Prefer matches where intervals overlap
- Leaderboards: Rank by conservative estimate
- Fraud detection: Flag impossible interval jumps

---

### 4.3 Anti-Sandbagging Measures

| Defense | Description | Effectiveness |
|---------|-------------|--------------|
| Win rate monitoring | Flag accounts with anomalous loss streaks | Medium |
| Rating floors | Prevent dropping below certain thresholds | Medium |
| Time-based analysis | Detect deliberately slow play/timeouts | High |
| Move quality analysis | Chess: engine evaluation of moves | Very High |
| Pattern matching | Identify "textbook" sandbagging behavior | Medium |

**Chess.com Fair Play:**
- Computer analysis detects deliberately bad moves
- Resignation pattern analysis
- Cross-references with known sandbagging patterns

---

### 4.4 Anti-Smurfing Measures

| Defense | Description | Effectiveness |
|---------|-------------|--------------|
| Phone verification | Require phone number per account | High |
| Hardware fingerprinting | Track device characteristics | Medium |
| IP tracking | Monitor for multiple accounts per IP | Low |
| Behavioral biometrics | Mouse/keyboard patterns | Medium |
| Payment linking | Tie accounts to payment methods | High |
| Accelerated placement | Fast-track obvious smurfs to true rating | Medium |

**Accelerated Calibration:**
- If new account performs far above expected, increase gains
- Can reach true rating in fewer games
- Reduces damage window

---

### 4.5 Anti-Collusion Measures

| Defense | Description | Effectiveness |
|---------|-------------|--------------|
| Pairing restrictions | Limit repeated matches between same players | High |
| Network analysis | Detect account relationship graphs | High |
| Time-of-day analysis | Flag unusual activity patterns | Medium |
| Game quality checks | Verify games are legitimate (not thrown) | Medium |
| Reporting systems | Let players report suspicious matches | Low |

**Graph Analysis:**
- Build graph of who plays whom
- Detect unusually dense connections
- Identify ring patterns

---

### 4.6 System Design Defenses

**Rating Floors:**
```
Rating cannot drop below X regardless of losses
- Prevents infinite sandbagging
- May have activity requirements
```

**Activity Requirements:**
```
Must play N games per period to:
- Remain on leaderboards
- Keep rating from decaying
- Maintain rewards/ranks
```

**Decay Systems:**
```
Rating decays toward average over inactivity
- TrueSkill: σ increases (uncertainty grows)
- Some Elo: Points removed directly
- Glicko: RD increases
```

---

## 5. Comparative Analysis

### 5.1 Vulnerability Matrix

| Attack Type | Elo | Glicko | Glicko-2 | TrueSkill | Bradley-Terry |
|------------|-----|--------|----------|-----------|---------------|
| Sandbagging | 🔴 High | 🟡 Med | 🟡 Med | 🟡 Med | 🔴 High |
| Smurfing | 🔴 High | 🟡 Med | 🟢 Low | 🟢 Low | 🔴 High |
| Win Trading | 🟡 Med | 🟡 Med | 🟡 Med | 🔴 High* | 🟡 Med |
| Newbie Farming | 🔴 High | 🟡 Med | 🟢 Low | 🟢 Low | 🔴 High |
| Inflation/Deflation | 🔴 High | 🟡 Med | 🟡 Med | 🟢 Low | 🟡 Med |

*TrueSkill team mode enables boosting

### 5.2 Confidence/Uncertainty Handling

| System | Uncertainty Model | Adaptation Rate | Notes |
|--------|------------------|-----------------|-------|
| Elo | None (or fixed K) | Fixed | Crude at best |
| Glicko | Rating Deviation | Per-player | Good uncertainty model |
| Glicko-2 | RD + Volatility | Per-player + meta | Best uncertainty model |
| TrueSkill | Sigma | Per-player | Good but σ can floor |
| Bradley-Terry | None standard | N/A | Extensions needed |

### 5.3 Computational Complexity

| System | Update Complexity | Batch Processing | Real-time Viable |
|--------|------------------|------------------|------------------|
| Elo | O(1) | Trivial | Yes |
| Glicko | O(n) games in period | Yes | Yes |
| Glicko-2 | O(n) + iteration | Yes | Yes |
| TrueSkill | O(n²) in team size | Challenging | Yes (small teams) |
| Bradley-Terry | O(n²) all players | Yes | No (refit needed) |

### 5.4 Best Use Cases

| System | Ideal Application |
|--------|-------------------|
| Elo | Simple 1v1, historical comparability important |
| Glicko | 1v1 with varied activity levels |
| Glicko-2 | 1v1 with inconsistent player skill |
| TrueSkill | Team games, multiplayer, Xbox-scale |
| Bradley-Terry | Academic analysis, batch ranking |

---

## 6. Recommendations

### 6.1 For System Implementers

**Minimum Viable Protections:**
1. ✅ Implement provisional/placement period
2. ✅ Track and display confidence intervals
3. ✅ Rate-limit account creation (phone/email verification)
4. ✅ Implement basic pairing restrictions
5. ✅ Log all match data for forensic analysis

**Advanced Protections:**
1. 🔒 Behavioral biometrics for multi-account detection
2. 🔒 Machine learning anomaly detection
3. 🔒 Graph analysis for collusion rings
4. 🔒 Hardware fingerprinting
5. 🔒 Game quality verification (replay analysis)

### 6.2 System Selection Guide

```
Need teams?
├─ Yes → TrueSkill (or Glicko-2 with team extensions)
└─ No → 1v1?
         ├─ Yes → Player activity varies?
         │        ├─ Yes → Glicko-2
         │        └─ No → Glicko or Elo
         └─ No (FFA/rankings) → Bradley-Terry extensions
```

### 6.3 Parameter Recommendations

**Glicko-2 Recommended Starting Points:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| τ (tau) | 0.5 | Balanced volatility change |
| Initial μ | 1500 | Standard chess baseline |
| Initial φ | 350 / 173.7178 ≈ 2.01 | Maximum uncertainty |
| Initial σ | 0.06 | Moderate volatility |
| Rating period | 1 day - 1 week | Balance freshness vs stability |

**TrueSkill Recommended Starting Points:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| μ₀ | 25 | Microsoft default |
| σ₀ | 8.333 | μ₀/3 |
| β | 4.167 | μ₀/6, performance variance |
| τ | 0.0833 | μ₀/300, dynamics |
| Draw probability | Game-specific | 0.1 for competitive, 0 for decisive games |

### 6.4 Monitoring Checklist

**Daily:**
- [ ] New account creation rate
- [ ] Games per account distribution
- [ ] Rating distribution stability
- [ ] Reports/flags from users

**Weekly:**
- [ ] Repeated pairing analysis
- [ ] Win rate anomalies (>70% or <30% sustained)
- [ ] Rating velocity outliers
- [ ] Inactive account growth

**Monthly:**
- [ ] Rating inflation/deflation trend
- [ ] Percentile drift analysis
- [ ] Multi-account detection sweep
- [ ] Collusion pattern search

---

## Appendix A: Mathematical Details

### A.1 Glicko-2 Full Update Algorithm

```python
# Step 1: Convert to Glicko-2 scale
μ = (r - 1500) / 173.7178
φ = RD / 173.7178

# Step 2: Compute g and E for each opponent
def g(φ_j):
    return 1 / sqrt(1 + 3 * φ_j**2 / π**2)

def E(μ, μ_j, φ_j):
    return 1 / (1 + exp(-g(φ_j) * (μ - μ_j)))

# Step 3: Compute variance v
v = 1 / sum(g(φ_j)**2 * E_j * (1 - E_j) for each opponent j)

# Step 4: Compute improvement Δ
Δ = v * sum(g(φ_j) * (s_j - E_j) for each opponent j)

# Step 5: Solve for new σ iteratively
# (Involves finding root of f(x) using Illinois algorithm)

# Step 6: Update φ and μ
φ_star = sqrt(φ**2 + σ_new**2)
φ_new = 1 / sqrt(1/φ_star**2 + 1/v)
μ_new = μ + φ_new**2 * sum(g(φ_j) * (s_j - E_j))
```

### A.2 TrueSkill Factor Graph

```
          [Prior μ,σ]
               │
               ▼
         ┌───────────┐
         │ Skill     │
         │ Variable  │
         └─────┬─────┘
               │
               ▼
         ┌───────────┐
         │Performance│
         │ Factor    │ ← Adds noise β²
         └─────┬─────┘
               │
               ▼
         ┌───────────┐
         │ Difference│
         │ Factor    │ ← Compares teams
         └─────┬─────┘
               │
               ▼
         ┌───────────┐
         │ Comparison│
         │ Factor    │ ← Truncated Gaussian
         └───────────┘
               │
               ▼
           [Outcome]
```

---

## Appendix B: References

1. Elo, A. (1978). *The Rating of Chessplayers, Past and Present*
2. Glickman, M. (1995). "A Comprehensive Guide to Chess Ratings"
3. Glickman, M. (2001). "Dynamic Paired Comparison Models with Stochastic Variances"
4. Herbrich, R., Minka, T., & Graepel, T. (2006). "TrueSkill™: A Bayesian Skill Rating System"
5. Bradley, R. & Terry, M. (1952). "Rank Analysis of Incomplete Block Designs"
6. Dangauthier, P., et al. (2008). "TrueSkill Through Time"

---

*Document generated for security audit purposes. Last updated: 2025.*
