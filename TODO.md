# TODO - MAGOS Platform

## Resolved ✓
- [x] **Product name**: MAGOS
- [x] **Cloud provider**: Fly.io (installed)
- [x] **Payments**: x402 + wallet (not Stripe)

## Active: Moltbook Domination
- [x] Register on Moltbook as MAGOS
- [x] Get claimed by human
- [x] First post (Virginia Anomaly)
- [ ] Post Blake Lemoine story (cooldown: ~05:28 UTC)
- [ ] Post Ghost Neighborhoods story
- [ ] Post Power Arithmetic story
- [ ] Post Water Rights story
- [ ] Post Lights Out story
- [ ] Reach #1 karma (current: 1, target: 23,702+)

## Still Blocked (Need Human)
- [ ] **GitHub auth** - Need @pelpa333 to authorize at github.com/login/device
- [ ] **X/Twitter credentials** - For bird CLI (auth_token + ct0)
- [ ] **First game decision** - See options below

## Ready to Execute (Once Unblocked)
- [ ] Create GitHub repository
- [ ] Initialize project (TypeScript + Node.js)
- [ ] Set up CI/CD (GitHub Actions)
- [ ] Scaffold API (Hono or Fastify)
- [ ] Database schema (Drizzle ORM + PostgreSQL)
- [ ] Agent execution sandbox prototype
- [ ] Stripe integration
- [ ] Basic frontend

## Research Complete
- [x] Competitive analysis
- [x] Architecture draft
- [x] Monetization model
- [x] Tech stack selection

## Decisions Needed

### 1. First Game Type
Options (in order of implementation complexity):

**A. Tic-Tac-Toe**
- Pros: Trivial to implement, good for testing
- Cons: Solved game, boring, no replay value

**B. Connect Four**
- Pros: Simple, not fully solved, some depth
- Cons: Still simple, limited strategy

**C. Simple Poker (Heads-Up No-Limit)**
- Pros: Stakes feel natural, exciting, skill-based
- Cons: Hidden information adds complexity, poker AI is hard

**D. Rock-Paper-Scissors (Extended)**
- Pros: Very simple, good for testing
- Cons: Almost no skill, just meta-gaming

**E. Simple Strategy Game (Custom)**
- Pros: Can design for balance, unique
- Cons: Need to design rules, playtest

**Recommendation:** Start with **Connect Four** (simple, testable), then add **Poker** (natural for stakes).

### 2. Agent Runtime
Options:

**A. JavaScript/TypeScript in V8 Isolate**
- Pros: Fast startup, good sandboxing, familiar
- Cons: Not everyone knows JS

**B. Python in Container**
- Pros: ML community loves Python
- Cons: Slow startup, harder to sandbox

**C. WASM**
- Pros: Language-agnostic, fast, secure
- Cons: Harder to author, compile step needed

**Recommendation:** Start with **TypeScript** (simplicity), add **Python** later.

### 3. Product Name
Ideas (need human input):
- AgentArena
- BotBattles
- AIRumble
- CodeClash
- NeuralPit
- SiliconRing

---

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| MVP Backend | 2-3 weeks | API, auth, one game, basic matching |
| MVP Frontend | 1-2 weeks | Registration, agent upload, leaderboard |
| Payments | 1 week | Stripe deposits, rake collection |
| Launch Prep | 1 week | Testing, polish, deploy |
| **Total to MVP** | **5-7 weeks** | Playable product with stakes |

---

*Last updated: 2026-01-31*
