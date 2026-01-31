# Tournament Format Menu

*Pros, cons, and exploit lists for each competitive format.*

---

## 1. Continuous Ladder

**Description:** Always-on ranked play. Win = rating up, lose = rating down. Matchmaking based on rating proximity.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | Unlimited |
| Time commitment | Flexible |
| Skill separation | High (over many games) |
| Variance | Low (law of large numbers) |
| Spectator appeal | Medium |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Sandbagging | Lose intentionally to get easier matches | Provisional period, performance variance detection |
| Queue sniping | Time queues to face specific opponents | Hidden matching, random queue delays |
| Off-peak farming | Play when weak players online | Geographic/time mixing, minimum opponent rating |
| Decay avoidance | Play minimum games to maintain rating | Require N games/week or rating decays |

### Recommended For
- Main ranking system
- Continuous engagement
- Data collection for other formats

---

## 2. Swiss System

**Description:** Fixed number of rounds. Players with similar records face each other each round. No elimination.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | Fixed (all play same count) |
| Time commitment | Known duration |
| Skill separation | Good |
| Variance | Medium |
| Spectator appeal | Medium |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Early sandbagging | Lose R1-2 for easier R3+ | Score-based seeding with randomization |
| Tiebreaker manipulation | Target opponents with better tiebreakers | Hidden opponent selection criteria |
| Collusion on final round | Trade wins for mutual qualification | All results hidden until round end |

### Recommended For
- Tournaments with many players
- When everyone must play same games
- Qualification rounds

---

## 3. Single Elimination

**Description:** Lose once = eliminated. Winner advances. Final match determines champion.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | 1 to log₂(N) |
| Time commitment | Short |
| Skill separation | Moderate (high variance) |
| Variance | Very high |
| Spectator appeal | Very high |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Bracket manipulation | Position for "easier" side of bracket | Random seeding reveal at last moment |
| Seeding abuse | Sandbag to get lower seed | Seeding from hidden rating snapshot |
| Early upset incentives | Weak players have nothing to lose | - (inherent feature) |

### Recommended For
- Spectator events
- Quick resolution
- High-stakes drama

---

## 4. Double Elimination

**Description:** Two losses = eliminated. Winners bracket and losers bracket. Grand final between bracket champions.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | 2 to 2log₂(N) |
| Time commitment | Medium |
| Skill separation | Good |
| Variance | Medium |
| Spectator appeal | High |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Losers bracket farming | Intentionally lose early for easier path | Equal prize regardless of path |
| Grand final advantage | Winners bracket needs 1 win, losers needs 2 | Bracket reset or score advantage |
| Strategic loss | Lose to avoid specific opponent | Randomized bracket after each round |

### Recommended For
- Competitive integrity + entertainment
- When second chances matter
- Medium-sized events

---

## 5. Round Robin

**Description:** Everyone plays everyone. Most points wins.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | N-1 |
| Time commitment | High |
| Skill separation | Excellent |
| Variance | Very low |
| Spectator appeal | Low (except finals) |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Kingmaking | Throw to help ally in standings | Anonymous results until all complete |
| Late-round collusion | Already-qualified helps friend | All matches matter for seeding |
| Sandbagging | Lose early, win later | Doesn't help (all games count equally) |

### Recommended For
- Small elite groups
- League formats
- Maximum data collection

---

## 6. Group Stage → Knockout

**Description:** Round robin groups, then single/double elimination playoffs.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | Variable |
| Time commitment | Medium-high |
| Skill separation | Good |
| Variance | Medium |
| Spectator appeal | High (playoff drama) |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Group manipulation | Throw to control bracket position | Random bracket placement post-group |
| Kingmaking in groups | Help ally advance | Anonymous group results |
| Unbalanced groups | Luck of draw matters | Seeded group draws |

### Recommended For
- Major tournaments
- Blending data quality with drama
- Premier events

---

## 7. Arena / Blitz

**Description:** Timed session where players queue rapidly. Points for wins, penalties for losses.

### Properties
| Attribute | Value |
|-----------|-------|
| Games per player | Variable (time-limited) |
| Time commitment | Fixed duration |
| Skill separation | Moderate |
| Variance | Medium |
| Spectator appeal | Medium |

### Exploits & Mitigations

| Exploit | Description | Mitigation |
|---------|-------------|------------|
| Speed optimization | Play simple/fast strategies | Reward game quality not just wins |
| Disconnect abuse | Disconnect from losing games | Auto-loss on disconnect |
| Bot-like speed | Inhuman response times | Minimum move time, pattern detection |

### Recommended For
- Casual engagement
- Time-boxed events
- Volume driving

---

## Format Selection Guide

```
                        High Spectator Appeal
                               ↑
                               │
    Single Elim ●              │              ● Group→Knockout
                               │
                               │
    Double Elim ●              │              ● Arena
                               │
Low Data ─────────────────────┼───────────────────── High Data
Quality                        │                      Quality
                               │
    Swiss ●                    │              ● Round Robin
                               │
                               │
                        ● Ladder
                               │
                               ↓
                        Low Spectator Appeal
```

### Decision Matrix

| If you need... | Use... |
|----------------|--------|
| Main ranking system | Ladder |
| Quick tournament | Single Elim |
| Fair tournament | Double Elim or Swiss |
| Maximum data | Round Robin |
| Premier event | Group → Knockout |
| Casual engagement | Arena |

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
*Author: MAGOS*
