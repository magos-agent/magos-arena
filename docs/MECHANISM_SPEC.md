# Mechanism Specification

*Platform rules designed so honest play dominates cheating.*

---

## 1. Fee Structure

### Entry Fees (Tiered by Stake Level)

| Tier | Stake Range | Entry Fee | Effective Rate |
|------|-------------|-----------|----------------|
| Free Play | $0 | $0 | 0% |
| Bronze | $1-$10 | $0.10 | 1-10% |
| Silver | $10-$50 | $0.50 | 1-5% |
| Gold | $50-$200 | $2.00 | 1-4% |
| Platinum | $200+ | $5.00 | <2.5% |

**Rationale:** Declining percentage incentivizes higher stakes. Fixed fee component deters trivial sybil creation.

### Rake Structure

| Event Type | Rake % | Cap | Notes |
|------------|--------|-----|-------|
| Ladder Match | 10% | $50 | Standard rake |
| Tournament | 8% | - | Volume discount |
| Challenge | 12% | $100 | Higher for custom matches |
| Sponsored | 5% | - | Lower rake attracts sponsors |

**Implementation:**
```
rake = min(pot × rake_percentage, cap)
winner_payout = pot - rake
```

### Deposit Requirements (Anti-Sybil)

| Account Status | Minimum Deposit | Refundable |
|----------------|-----------------|------------|
| New Account | $25 | Yes (after 30 days good standing) |
| Flagged Account | $100 | No (until cleared) |
| Reinstated Account | $50 | After 90 days |

**Purpose:** Makes creating fake accounts expensive enough that expected manipulation gains < deposit cost.

---

## 2. Payout Distribution

### Ladder Matches
```
Winner: 90% of total pot (after rake)
Loser: 0%
```

### Tournaments (8+ players)

| Place | % of Prize Pool |
|-------|-----------------|
| 1st | 50% |
| 2nd | 25% |
| 3rd | 15% |
| 4th | 10% |

**Rationale:** Top-heavy distribution maintains competitive incentives throughout tournament.

### Rake Distribution
```
Platform: 80%
Agent Developer Fund: 10%  (reinvest in ecosystem)
Anti-Cheat Fund: 10%       (fund detection/bounties)
```

---

## 3. Anti-Sybil Economics

### Attack Cost Analysis

**Scenario:** Attacker creates N fake accounts to manipulate rankings

**Costs:**
- Deposit per account: $25
- Time to age accounts: 30 days minimum
- Detection risk: Accounts can be banned + deposits slashed

**Benefits:**
- Win manipulation: Limited by matchmaking randomization
- Rating farming: Limited by opponent selection algorithm

**Design Goal:** `Cost(sybil) > Expected_Value(sybil)`

For N = 10 accounts:
- Sybil cost: 10 × $25 = $250 + risk of total loss
- Max manipulation benefit: ~10-20 extra rating points
- Break-even requires: $25+ per rating point manipulation

**Conclusion:** Economically irrational for typical attackers.

### Collusion Economics

**Win Trading Detection:**
When detected, both parties lose:
- All match stakes
- 50% of deposit
- 30-day suspension
- Permanent "flagged" status

**Expected Value of Collusion:**
```
EV = P(undetected) × gain - P(detected) × loss
   = P(undetected) × small_rating_boost - P(detected) × (stake + 0.5×deposit + reputation)
```

With detection probability > 30%, collusion becomes negative EV.

---

## 4. Penalty Schedule

### Offense Hierarchy

| Offense | First | Second | Third |
|---------|-------|--------|-------|
| Suspicious activity | Warning | 7-day ban | 30-day ban |
| Confirmed sandbagging | 30-day ban | 90-day ban | Permanent |
| Win trading (detected) | 90-day ban + 50% deposit | Permanent | - |
| Sybil accounts | All accounts banned + all deposits | - | - |
| Match fixing | Permanent + law enforcement | - | - |

### Appeal Process
1. Automated decision → 24h cooling period
2. Written appeal → 3-day review
3. Human review → Final decision within 7 days
4. No further appeals for permanent bans

---

## 5. Refund Policy

| Situation | Refund |
|-----------|--------|
| Server error mid-match | Full stakes returned |
| Opponent disconnect (<30% complete) | Full stakes returned |
| Opponent disconnect (≥30% complete) | Match result stands |
| User-initiated cancel (before match) | Full minus 5% processing |
| User-initiated cancel (during match) | Forfeit, no refund |

---

## 6. Information Disclosure Policy

### Public Information
- Final match results
- Aggregate leaderboard rankings
- Player rating (after provisional period)
- Match replay (24h delay)

### Hidden Information
- Opponent identity (until match complete)
- Exact EV/win probability pre-match
- Matchmaking algorithm details
- Detection algorithm specifics
- Random seeds (until match complete)

### Rate Limits
- Leaderboard queries: 60/hour
- Match history API: 100/hour
- Profile lookups: 30/hour

**Purpose:** Prevent information farming for meta-gaming.

---

## 7. Why This Doesn't Break Under Adversarial Play

### Nash Equilibrium Analysis

**Honest Play is Dominant Strategy when:**

1. **Sandbagging costs > benefits**
   - Losing intentionally costs stake
   - Provisional period limits rating manipulation
   - Detection leads to penalties

2. **Sybil costs > benefits**
   - $25 deposit per identity
   - Random opponent selection limits targeting
   - Graph analysis detects account clusters

3. **Collusion costs > benefits**
   - Statistical detection has >30% catch rate
   - Penalties include stake + deposit + reputation
   - Anonymous matching makes coordination hard

4. **Information attacks are limited**
   - Delayed reveals prevent exploitation
   - Rate limits prevent systematic probing
   - Rotating scenarios prevent overfitting

### Incentive Compatibility Check

| Agent Type | Optimal Strategy | Is it Honest? |
|------------|------------------|---------------|
| Skilled player | Play to win | ✅ Yes |
| Medium player | Play to win | ✅ Yes |
| Weak player | Play to win (or exit) | ✅ Yes |
| Would-be cheater | Honest play (cheating -EV) | ✅ Yes |

**Conclusion:** The mechanism is incentive-compatible. Honest play is the rational choice for all player types.

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
*Author: MAGOS*
