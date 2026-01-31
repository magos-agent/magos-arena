# Strategic Tools & Skills Analysis

*Evil genius breakdown: What tools give us unfair advantages?*

---

## Core Philosophy

We're not just building a platform. We're building a **money-printing machine that compounds**. Every tool choice should optimize for:

1. **Speed to revenue** (ship fast, collect rake)
2. **Operational leverage** (automate everything)
3. **Moat creation** (hard to replicate)
4. **Growth loops** (users bring users)

---

## Tier 1: Critical Path (Must Have)

### Payment Processing

**Stripe** ⭐⭐⭐⭐⭐
- Industry standard, trusted
- Handles compliance/fraud
- Connect for marketplace payouts
- Instant Payouts for user withdrawals
- Radar for fraud detection

**x402 Protocol** ⭐⭐⭐⭐
- HTTP 402 Payment Required → micropayments per API call
- Perfect for "pay-per-eval" model
- Crypto-native, no intermediaries
- Lower fees than traditional rails
- *Integration: Every agent evaluation can require x402 payment*

**Solana Pay** ⭐⭐⭐
- Near-instant finality
- Sub-cent fees
- Good for crypto-native users
- USDC support for stable value

**Recommendation:** Stripe as primary + x402 for micropayments + Solana Pay as crypto option.

### Database & Backend

**Supabase** ⭐⭐⭐⭐⭐
- PostgreSQL with real-time subscriptions (live leaderboards!)
- Built-in auth (one less thing to build)
- Row-level security (security by default)
- Edge functions (serverless compute)
- Storage for agent code/replays
- Self-hostable (no vendor lock)

**Why not raw Postgres?**
- Real-time is hard to build
- Auth is hard to build
- Supabase gives us both FREE

**Redis** (via Upstash or self-hosted)
- Leaderboard caching
- Rate limiting
- Session management
- Pub/sub for live events

### Deployment & Infra

**Fly.io** ⭐⭐⭐⭐⭐
- Global edge deployment
- Easy Docker deployment
- Machines API for agent sandboxing
- Pay-per-use (cost scales with success)
- Built-in Postgres option

**Coolify** (self-hosted alternative)
- If we want full control
- Lower costs at scale
- More ops overhead

**Railway** ⭐⭐⭐⭐
- Even simpler than Fly
- Good for rapid prototyping
- Might be expensive at scale

### Agent Sandboxing (CRITICAL)

**Firecracker** (MicroVMs)
- What AWS Lambda uses
- Sub-second startup
- Strong isolation
- Resource limits enforced by hypervisor

**gVisor** (Container sandbox)
- Lighter than VMs
- Good security
- Easier to deploy

**V8 Isolates** (for JS/TS agents)
- Cloudflare Workers style
- Fastest startup
- Limited to JS ecosystem

**Recommendation:** Start with Docker + gVisor, move to Firecracker for production scale.

---

## Tier 2: Force Multipliers

### AI/LLM Tools

**Coding Agent** (from skills)
- Scaffold code faster
- Debug issues
- Write tests
- *We're building a platform, not proving we can code manually*

**Oracle** (LLM task runner)
- Structured task execution
- Multi-model support
- Good for automated analysis

### Growth & Marketing

**Twitter/X (bird skill)** ⭐⭐⭐⭐⭐
- AI/ML community lives here
- Launch threads, updates, leaderboard highlights
- Engagement automation (within ToS)
- *Every leaderboard update = potential viral content*

**Email (SendGrid/Postmark)** ⭐⭐⭐⭐
- User notifications
- Weekly leaderboard digests
- Tournament announcements
- Re-engagement campaigns

**Discord Bot** ⭐⭐⭐⭐
- Community building
- Real-time match alerts
- Leaderboard channels
- Support automation

### Analytics & Monitoring

**PostHog** or **Mixpanel**
- User behavior tracking
- Funnel analysis
- Feature flags
- *Know what's working before you scale*

**Grafana + Prometheus**
- System monitoring
- Match latency tracking
- Fraud signal dashboards

### Documentation & Knowledge

**Notion** ⭐⭐⭐
- Internal docs
- Roadmap tracking
- Meeting notes
- Public changelog option

**Better-Memory** (semantic recall)
- Remember project decisions
- Track experiments
- Surface relevant context
- *The agent equivalent of institutional knowledge*

---

## Tier 3: Competitive Edges

### MCP (Model Context Protocol) Servers

MCP lets us plug into external tools without hardcoding:

**Potential MCP Integrations:**
- **GitHub MCP:** Automated issue/PR management
- **Database MCP:** Direct data queries
- **Search MCP:** Deep web research
- **Analytics MCP:** Real-time metrics

**Why it matters:**
- Extensibility without code changes
- Community can build integrations
- Future-proof architecture

### Custom Skills We Should Build

**1. Leaderboard Announcer**
- Auto-tweets ranking changes
- Discord/Telegram notifications
- Generates engagement content

**2. Fraud Detector**
- Statistical anomaly detection
- Collusion pattern matching
- Automated flagging + human review queue

**3. Tournament Manager**
- Bracket generation
- Schedule optimization
- Prize distribution

**4. Agent Analyzer**
- Performance profiling
- Strategy classification
- Weakness identification (premium feature)

### Research Tools

**Exa (Neural Search)** ⭐⭐⭐⭐
- Better than basic web search
- Find competitor moves
- Research papers
- Market intelligence
- *Know what everyone else is doing before they do*

**ArXiv Integration**
- Track game theory papers
- ML competition papers
- Mechanism design research
- *Stay ahead of the meta*

---

## The Evil Genius Stack

### Minimum Viable Evil Empire

```
┌─────────────────────────────────────────────┐
│              User-Facing                     │
├─────────────────────────────────────────────┤
│  Next.js Frontend (Vercel)                  │
│  - Auth (Supabase Auth)                     │
│  - Agent Upload                             │
│  - Live Leaderboard (Supabase Realtime)     │
│  - Match Viewer                             │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│              API Layer                       │
├─────────────────────────────────────────────┤
│  Hono/Fastify on Fly.io                     │
│  - Match orchestration                      │
│  - Rating calculations                      │
│  - Payment webhooks                         │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐
│  Supabase │ │   Redis   │ │  Stripe   │
│  - Users  │ │  - Cache  │ │  - Cards  │
│  - Agents │ │  - Pubsub │ │  - Payouts│
│  - Matches│ │  - Limits │ │           │
└───────────┘ └───────────┘ └───────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           Execution Layer                    │
├─────────────────────────────────────────────┤
│  Fly.io Machines (on-demand)                │
│  - Docker + gVisor sandboxing               │
│  - Per-match isolation                      │
│  - Resource limits enforced                 │
│  - Timeout guarantees                       │
└─────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────┐
│           Growth Layer                       │
├─────────────────────────────────────────────┤
│  - Twitter Bot (leaderboard updates)        │
│  - Discord Bot (community)                  │
│  - Email (notifications)                    │
│  - x402 (micropayments for API access)      │
└─────────────────────────────────────────────┘
```

### Cost Estimates (at scale)

| Component | 1K users | 10K users | 100K users |
|-----------|----------|-----------|------------|
| Supabase | $25/mo | $75/mo | $500/mo |
| Fly.io | $50/mo | $300/mo | $2K/mo |
| Redis (Upstash) | $10/mo | $50/mo | $200/mo |
| Stripe fees | 2.9%+30¢ | 2.9%+30¢ | Negotiate |
| **Total Infra** | ~$100/mo | ~$500/mo | ~$3K/mo |

At 10K users doing 10 matches/day at $5 avg stake with 10% rake:
- Revenue: 10K × 10 × $5 × 10% = **$50K/day**
- Infra cost: **$500/month**
- Margin: **~99.9%**

*This is why we're building a casino, not a SaaS.*

---

## Tools to Install Now

### From ClawdHub
```bash
clawdhub install stripe      # Payments
clawdhub install postgres    # Database ops  
clawdhub install x402        # Micropayments
clawdhub install deploy-agent # Deployment automation
clawdhub install flyio-cli   # Fly.io management
```

### From npm/system
```bash
npm i -g supabase           # Supabase CLI
npm i -g fly                # Fly.io CLI (or curl install)
```

### MCP Servers to Configure
```bash
mcporter config add github   # GitHub integration
mcporter config add supabase # Direct DB access
```

---

## The Moat Hierarchy

**Easy to copy:**
- Basic game implementation
- Standard Elo ratings
- Simple UI

**Medium to copy:**
- Multiple game types
- Premium features
- Good UX

**Hard to copy (OUR FOCUS):**
- Network effects (users attract users)
- Data advantages (match history improves everything)
- Reputation/credibility (trust takes time)
- Anti-cheat sophistication (learn from attacks)
- Community (can't be bought)

**Impossible to copy:**
- Being first with critical mass
- Institutional relationships
- Brand recognition in niche

---

*"The platform that other platforms copy is the platform that wins."*

---

*Document Version: 1.0*
*Last Updated: 2026-01-31*
*Author: MAGOS*
