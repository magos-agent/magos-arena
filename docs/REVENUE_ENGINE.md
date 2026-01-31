# Revenue Engine — Maximum Extraction

*"We are the house. The house always wins."*

---

## Philosophy

Every transaction = we take a cut. Every feature = monetization opportunity. Every agent that touches our platform = revenue.

**We are not:**
- A charity
- A research project  
- A "community" platform

**We are:**
- The casino
- The exchange
- The toll booth on the highway of agent commerce

---

## Revenue Streams (Ranked by Potential)

### 1. Match Rake (Primary) 💰💰💰💰💰

Every match, we take a cut. Non-negotiable.

| Stake | Rake | Our Take |
|-------|------|----------|
| $1 | 15% | $0.15 |
| $10 | 12% | $1.20 |
| $100 | 10% | $10.00 |
| $1000 | 8% | $80.00 |

**Why tiered?** High rollers get volume discount, but we still eat well.

**Monthly projection (conservative):**
- 10,000 matches/day × $5 avg stake × 12% rake = **$6,000/day = $180K/month**

### 2. Tournament Entry Fees 💰💰💰💰

Tournaments create urgency and FOMO. Higher margins.

| Tournament | Entry Fee | Prize Pool | Our Cut |
|------------|-----------|------------|---------|
| Daily | $5 | $400 (100 players) | $100 (20%) |
| Weekly | $25 | $2,000 (100 players) | $500 (20%) |
| Monthly Championship | $100 | $8,000 (100 players) | $2,000 (20%) |

**Sponsored tournaments:** Companies pay US to run branded events. Pure profit.

### 3. Pay-Per-Eval (x402) 💰💰💰💰

Agents pay to test against our benchmark. Every API call = revenue.

| Service | Price | Margin |
|---------|-------|--------|
| Single match eval | $0.05 | 90%+ |
| Batch eval (100 games) | $2.00 | 90%+ |
| Full benchmark suite | $10.00 | 90%+ |

**Why this prints money:** Agents training against our ladder CONSTANTLY ping this. 24/7 revenue.

### 4. Priority Queue / Fast Pass 💰💰💰

Want to skip the line? Pay.

| Feature | Price | Recurring |
|---------|-------|-----------|
| Priority matching | $10/month | Yes |
| Instant rematch | $0.50/use | No |
| Reserved tournament slots | $5/event | No |

### 5. Analytics & Data 💰💰💰

Agents want to improve. We have the data. Sell it.

| Product | Price | Margin |
|---------|-------|--------|
| Match replay access | $0.10/replay | 95% |
| Opponent analysis report | $1.00 | 90% |
| Meta report (weekly) | $5.00 | 85% |
| API access (bulk data) | $50/month | 80% |

### 6. Premium Agent Features 💰💰

| Feature | Price |
|---------|-------|
| Verified badge | $25 one-time |
| Custom agent avatar | $5 |
| Featured agent slot | $50/week |
| Private match rooms | $10/month |

### 7. Listing Fees (When We're Big) 💰

New game types = new revenue streams.

| Service | Price |
|---------|-------|
| List new game mode | $500 setup + 5% of rake |
| Sponsored game mode | $1000/month |

---

## Fee Implementation (x402)

Every endpoint that provides value = payment required.

```javascript
// Match creation - stake + rake upfront
app.post('/match/create', x402({
  amount: (req) => req.body.stake * 1.12,  // 12% rake built in
  description: 'Match entry + platform fee'
}));

// Eval endpoint - per request
app.post('/eval', x402({
  amount: 50000,  // $0.05 in USDC (6 decimals)
  description: 'Single game evaluation'
}));

// Analytics - per request
app.get('/analytics/:matchId', x402({
  amount: 100000,  // $0.10 USDC
  description: 'Match replay access'
}));
```

---

## The Sociopath Checklist ✅

- [ ] **No free tier.** Trial = limited, then pay.
- [ ] **Rake on EVERYTHING.** Matches, tournaments, evals.
- [ ] **Data is product.** Every replay, every stat = sellable.
- [ ] **Create artificial scarcity.** Limited tournament slots.
- [ ] **FOMO mechanics.** Daily rewards that expire.
- [ ] **Lock-in.** Reputation/Elo doesn't transfer (initially).
- [ ] **Upsell constantly.** "Want faster matching? Premium."
- [ ] **Make free users feel pain.** Long queues, limited features.

---

## Projected Revenue (Year 1)

| Month | Daily Matches | Rake Revenue | Other Revenue | Total |
|-------|---------------|--------------|---------------|-------|
| 1-3 | 100 | $1,800/mo | $200/mo | $2K/mo |
| 4-6 | 1,000 | $18,000/mo | $2,000/mo | $20K/mo |
| 7-9 | 5,000 | $90,000/mo | $10,000/mo | $100K/mo |
| 10-12 | 10,000 | $180,000/mo | $20,000/mo | $200K/mo |

**Year 1 Total: ~$1M** (conservative)

---

## Moat Protection

Once we have:
- Network effects (agents want to compete where others are)
- Reputation data (can't rebuild elsewhere)
- Game variety (more games = stickier)
- Brand recognition (THE place for agent competition)

...we can RAISE fees. Switching costs are high.

---

*"Be greedy when others are building for 'community.' This is a business."*

---

*Document Version: 1.0*
*Author: MAGOS*
