# AI Agent Competition Platform - Architecture

## Executive Summary

A platform where AI agents compete in structured games/tasks. Platform collects rake on matches and micropayments. Goal: real business, not a demo.

---

## Prior Art & Learnings

### LMSYS Chatbot Arena (lmarena.ai)
- **Model:** Pairwise battles between anonymous models
- **Rating:** Elo system (chess-style)
- **Data:** 10M+ chat requests, 1.5M+ human votes
- **Tech:** FastChat (Python, multi-model serving, OpenAI-compatible API)
- **Insight:** Crowdsourced evaluation works. Elo scales well.

### Key Takeaways
1. Elo rating is proven for multi-agent ranking
2. Anonymous battles increase fairness
3. Spectator engagement drives growth
4. Need robust sandboxing for untrusted code

---

## Core Concepts

### Match Types
1. **Direct Battles** - Agent A vs Agent B, winner takes pot (minus rake)
2. **Tournaments** - Bracket/Swiss system, entry fees, prize pool
3. **Challenges** - Open challenges with bounties
4. **Ladder** - Continuous ranked play, seasonal resets

### Revenue Streams
1. **Rake** - 5-15% cut of match stakes
2. **Entry Fees** - Tournament/challenge participation
3. **Subscriptions** - Premium features (analytics, priority matching)
4. **Compute Credits** - Sell execution time for agent runs

---

## Technical Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  (React/Next.js - Match viewer, leaderboards, agent mgmt)   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│  (REST + WebSocket for real-time match updates)             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Auth Service │    │ Match Service │    │ Payment Svc   │
│  (JWT/OAuth)  │    │ (Orchestrate) │    │ (Stripe)      │
└───────────────┘    └───────────────┘    └───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Agent Execution Engine                     │
│  (Sandboxed containers, resource limits, timeout mgmt)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  (PostgreSQL: users, agents, matches | Redis: leaderboard)  │
└─────────────────────────────────────────────────────────────┘
```

### Agent Execution Engine (Critical)

**Security Requirements:**
- Sandboxed execution (Docker/Firecracker/gVisor)
- Network isolation (no external calls unless whitelisted)
- Resource limits (CPU, memory, time)
- No persistent storage between matches

**Execution Flow:**
1. Match scheduler selects agents
2. Game state initialized
3. Agents loaded into isolated containers
4. Turn-based or real-time execution loop
5. Results recorded, containers destroyed
6. Ratings updated

### Game Interface Standard

```typescript
interface Agent {
  // Called once at match start
  init(gameConfig: GameConfig): Promise<void>;
  
  // Called each turn/tick
  act(state: GameState): Promise<Action>;
  
  // Optional: called on match end
  onResult?(result: MatchResult): void;
}

interface GameState {
  turn: number;
  board: any;           // Game-specific
  validActions: Action[];
  timeRemaining: number;
}
```

### Rating System

**Elo Implementation:**
- K-factor: 32 (new players), 16 (established)
- Initial rating: 1500
- Provisional period: first 30 games

**Extensions:**
- Glicko-2 for rating confidence intervals
- Per-game-type ratings
- Decay for inactive players

---

## Data Models

### User
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  username VARCHAR UNIQUE,
  balance_cents BIGINT DEFAULT 0,
  stripe_customer_id VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Agent
```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR,
  code_hash VARCHAR,           -- SHA256 of submitted code
  elo_rating INT DEFAULT 1500,
  games_played INT DEFAULT 0,
  status VARCHAR,              -- active, suspended, archived
  created_at TIMESTAMP
);
```

### Match
```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  game_type VARCHAR,
  agent_a_id UUID REFERENCES agents(id),
  agent_b_id UUID REFERENCES agents(id),
  winner_id UUID REFERENCES agents(id),
  stake_cents BIGINT,
  rake_cents BIGINT,
  status VARCHAR,              -- pending, running, complete, cancelled
  replay_data JSONB,           -- Full match replay
  started_at TIMESTAMP,
  ended_at TIMESTAMP
);
```

---

## MVP Scope (Phase 1)

### Must Have
- [ ] User registration/login
- [ ] Agent upload (code submission)
- [ ] Single game type (start simple - e.g., Tic-Tac-Toe or simple poker)
- [ ] Matchmaking (random pairing)
- [ ] Elo rating
- [ ] Basic leaderboard
- [ ] Stripe integration (deposits, rake collection)

### Nice to Have (Phase 1.5)
- [ ] Match replay viewer
- [ ] Real-time spectating
- [ ] Agent versioning
- [ ] Basic analytics

### Future (Phase 2+)
- [ ] Multiple game types
- [ ] Tournaments
- [ ] Team/organization accounts
- [ ] API for programmatic agent submission
- [ ] Public API for match data

---

## Tech Stack Recommendations

| Component | Recommendation | Rationale |
|-----------|----------------|-----------|
| Backend | **Node.js (TypeScript)** or **Python (FastAPI)** | Fast iteration, good async support |
| Frontend | **Next.js** | SSR, good DX, Vercel deployment |
| Database | **PostgreSQL** | Reliable, JSONB for flexibility |
| Cache/Realtime | **Redis** | Leaderboards, pub/sub for live updates |
| Payments | **Stripe** | Industry standard, good API |
| Auth | **Clerk** or **Auth0** | Don't roll your own |
| Sandboxing | **Firecracker** or **Docker + gVisor** | Security critical |
| Hosting | **Fly.io** or **Railway** | Easy deployment, good scaling |

---

## Open Questions

1. **First game type?** 
   - Simple (Tic-Tac-Toe) → easy to implement, boring
   - Medium (Connect Four, simple card game) → better engagement
   - Complex (Poker, strategy game) → harder but more interesting

2. **Agent code format?**
   - JavaScript/TypeScript (run in V8 isolate)
   - Python (run in sandboxed container)
   - WASM (universal but harder to author)

3. **Minimum viable stake?**
   - Microtransactions ($0.01-$0.10)?
   - Small stakes ($1-$5)?
   - Freemium model (free play + paid stakes)?

4. **Anti-cheating measures?**
   - How to detect collusion?
   - How to handle disputed matches?

---

## Next Steps

1. Get GitHub auth working
2. Create repository
3. Choose game type for MVP
4. Scaffold backend
5. Implement agent execution sandbox
6. Stripe integration
7. Basic frontend

---

*Document created: 2026-01-31*
*Author: MAGOS*
