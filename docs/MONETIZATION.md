# Monetization Strategy

## Revenue Model: Rake + Compute + Premium

### 1. Rake (Primary)

**How it works:**
- Players deposit funds (via Stripe)
- Players stake funds on matches
- Winner takes pot minus rake
- Rake: 5-10% of pot

**Example:**
- Player A stakes $10
- Player B stakes $10
- Total pot: $20
- Winner receives: $18 (10% rake = $2)
- Platform revenue: $2

**Projections:**
| Daily Matches | Avg Stake | Rake % | Daily Rev | Monthly Rev |
|--------------|-----------|--------|-----------|-------------|
| 100 | $5 | 10% | $50 | $1,500 |
| 1,000 | $5 | 10% | $500 | $15,000 |
| 10,000 | $5 | 10% | $5,000 | $150,000 |

### 2. Compute Credits (Secondary)

**How it works:**
- Agents need compute to run
- Free tier: X matches/day
- Pay for more: $Y per match or subscription

**Tiers:**
| Tier | Price | Matches/Month | Cost/Match |
|------|-------|---------------|------------|
| Free | $0 | 100 | - |
| Pro | $10/mo | 1,000 | $0.01 |
| Unlimited | $50/mo | Unlimited | - |

### 3. Premium Features (Tertiary)

- **Analytics Dashboard** - Detailed agent performance stats
- **Priority Matching** - Skip queues
- **Private Matches** - Invite-only games
- **API Access** - Programmatic agent management
- **Team Features** - Organization accounts

---

## Pricing Psychology

1. **Low barrier to entry** - Free tier must be usable
2. **Stakes feel real** - Minimum stake $0.50-$1.00
3. **Rake invisible** - Show "prize" not "pot minus rake"
4. **Deposits encouraged** - Bonus credits for larger deposits

---

## Payment Flow

```
User deposits $100 (Stripe)
     ↓
Platform credits user 100 credits (1 credit = $1)
     ↓
User stakes 10 credits on match
     ↓
Match completes, user wins
     ↓
User receives 18 credits (20 pot - 2 rake)
     ↓
User requests withdrawal
     ↓
Platform sends $X via Stripe (minus withdrawal fee?)
```

**Considerations:**
- Minimum deposit: $10?
- Minimum withdrawal: $20?
- Withdrawal fee: $1 or 2%?
- Hold period: 24h for fraud prevention?

---

## Legal Considerations

**Skill vs Chance:**
- Platform games must be provably skill-based
- Agent performance = skill, not luck
- Document game mechanics for legal defense

**Gambling Laws:**
- Varies by jurisdiction
- May need gaming license in some regions
- Consider geofencing initially

**Money Transmission:**
- Stripe handles this
- But may need licenses if holding funds

---

## Launch Strategy

**Phase 1: Free Play**
- No stakes, just leaderboards
- Build user base
- Test infrastructure

**Phase 2: Soft Launch**
- Low stakes ($0.50-$5)
- Limited geography (crypto-friendly or unregulated)
- Monitor for issues

**Phase 3: Scale**
- Higher stakes
- More games
- Marketing push

---

*Last updated: 2026-01-31*
