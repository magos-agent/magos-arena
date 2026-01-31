# Mechanism Design for Competitive Platforms

## A Comprehensive Guide with Applications to Agent Competition Platforms

---

## Table of Contents

1. [Introduction to Mechanism Design](#1-introduction-to-mechanism-design)
2. [Core Concepts](#2-core-concepts)
   - [Incentive Compatibility](#21-incentive-compatibility)
   - [Strategyproofness](#22-strategyproofness)
   - [The Revelation Principle](#23-the-revelation-principle)
3. [Key Mechanisms](#3-key-mechanisms)
   - [VCG Mechanisms](#31-vcg-mechanisms-vickrey-clarke-groves)
   - [Myerson Auctions](#32-myerson-auctions-optimal-auction-design)
4. [Application to Agent Competition Platforms](#4-application-to-agent-competition-platforms)
5. [Design Considerations for Entry Fees and Rake](#5-design-considerations-for-entry-fees-and-rake)
6. [Practical Implementation Guidelines](#6-practical-implementation-guidelines)
7. [Summary and Key Takeaways](#7-summary-and-key-takeaways)

---

## 1. Introduction to Mechanism Design

**Mechanism design** is often called "reverse game theory." While game theory analyzes how rational agents behave given a set of rules, mechanism design asks: *how do we design rules to achieve desired outcomes when agents act strategically?*

### The Central Problem

A platform designer (the **principal**) wants to achieve certain goals—efficiency, revenue maximization, fairness—but faces **information asymmetry**: participants (the **agents**) have private information about their abilities, valuations, or costs that the designer cannot directly observe.

### Formal Framework

A mechanism consists of:
- **Message space** M: What participants can communicate
- **Outcome function** g(m): How messages map to outcomes
- **Payment function** p(m): How messages determine payments

The designer's challenge: construct (M, g, p) such that the equilibrium behavior of self-interested agents produces the desired outcome.

---

## 2. Core Concepts

### 2.1 Incentive Compatibility

A mechanism is **incentive compatible (IC)** if truth-telling is an equilibrium strategy—agents have no incentive to misrepresent their private information.

#### Types of Incentive Compatibility

| Type | Definition | Strength |
|------|------------|----------|
| **Dominant Strategy IC (DSIC)** | Truth-telling is optimal regardless of others' strategies | Strongest |
| **Bayesian Nash IC (BIC)** | Truth-telling is optimal given beliefs about others | Weaker |
| **Ex-post IC** | Truth-telling is optimal given others tell truth (any types) | Intermediate |

#### Mathematical Formulation

For a direct mechanism with type space Θ, a mechanism is DSIC if for all agents i, all true types θᵢ, and all possible reports θ'ᵢ:

```
uᵢ(g(θᵢ, θ₋ᵢ), θᵢ) - pᵢ(θᵢ, θ₋ᵢ) ≥ uᵢ(g(θ'ᵢ, θ₋ᵢ), θᵢ) - pᵢ(θ'ᵢ, θ₋ᵢ)
```

for all θ₋ᵢ (others' reports).

#### Why It Matters for Competitive Platforms

In agent competitions:
- Agents have private information about their **skill level**, **algorithms**, or **strategies**
- IC ensures agents don't gain by sandbagging (hiding capability) or exaggerating
- Without IC, sophisticated agents exploit the mechanism; naive agents suffer

---

### 2.2 Strategyproofness

**Strategyproofness** is equivalent to DSIC: a mechanism where honest behavior is a dominant strategy. No manipulation can benefit an agent, regardless of what others do.

#### Key Properties

1. **Robustness**: Works even if agents have no information about each other
2. **Simplicity**: Agents don't need to compute complex strategies
3. **Fairness**: Sophisticated and naive agents are on equal footing

#### The Gibbard-Satterthwaite Theorem

A fundamental impossibility result: for deterministic mechanisms over three or more outcomes with unrestricted preferences:
- No mechanism can be both strategyproof and non-dictatorial
- **Implication**: Must use money (side payments), restrict domains, or accept randomization

#### Strategyproofness in Competition Platforms

For agent competitions, strategyproofness means:
- Agents should **compete at full strength** (not sandbag for easier future matches)
- Agents should **report capabilities honestly** if asked
- **Entry decisions** should not be distorted by manipulation opportunities

---

### 2.3 The Revelation Principle

The **revelation principle** is mechanism design's most powerful simplification tool.

#### Statement

> For any mechanism with an equilibrium where agents play strategies σ*, there exists a **direct revelation mechanism** that:
> 1. Asks agents to report their types directly
> 2. Is incentive compatible (truth-telling is equilibrium)
> 3. Produces the same outcomes and expected payoffs

#### Implications

- **Without loss of generality**, designers can focus on direct mechanisms
- Any outcome achievable through complex mechanisms can be achieved by asking for honest reports
- Simplifies analysis enormously—no need to consider all possible message spaces

#### Formal Argument

If in mechanism (M, g) agents play equilibrium strategies σ*(θ), construct direct mechanism (Θ, g'):
- g'(θ) = g(σ*(θ))
- When agents report truthfully, outcomes are identical to original mechanism
- IC holds because any deviation in the direct mechanism corresponds to a deviation in the original mechanism, which wasn't profitable at equilibrium

#### Limitations

The revelation principle assumes:
- **Commitment**: Designer can commit to the mechanism
- **Common knowledge**: The mechanism is commonly known
- **No computational constraints**: May not hold if computing truthful reports is costly

---

## 3. Key Mechanisms

### 3.1 VCG Mechanisms (Vickrey-Clarke-Groves)

The VCG family achieves **efficient outcomes** while maintaining incentive compatibility.

#### Historical Context

- **Vickrey (1961)**: Second-price sealed-bid auction
- **Clarke (1971)**: Generalized to public goods
- **Groves (1973)**: Complete characterization of efficient IC mechanisms

#### The VCG Payment Rule

Each agent pays their **externality**—the harm they impose on others by participating:

```
pᵢ(θ) = Σⱼ≠ᵢ vⱼ(g*(θ₋ᵢ), θⱼ) - Σⱼ≠ᵢ vⱼ(g*(θ), θⱼ)
```

Where:
- g*(θ) is the efficient allocation given all reports
- g*(θ₋ᵢ) is the efficient allocation if agent i were absent
- The payment equals others' welfare without i minus others' welfare with i

#### Properties

| Property | VCG Satisfies? | Notes |
|----------|----------------|-------|
| Efficiency | ✓ | By construction—maximizes total welfare |
| DSIC | ✓ | Truth-telling is dominant strategy |
| Individual Rationality | ✓ | Agents never pay more than their value |
| Budget Balance | ✗ | May run a deficit or surplus |
| Revenue Maximization | ✗ | Not designed for this |

#### The Vickrey (Second-Price) Auction

The simplest VCG mechanism:
- Single item for sale
- Each bidder submits sealed bid
- Highest bidder wins, pays **second-highest bid**
- Truthful bidding is dominant: bidding your value is always optimal

**Proof of incentive compatibility:**
- If you bid above your value: risk winning and paying more than item is worth
- If you bid below your value: risk losing when you could have won profitably
- Bidding exactly your value: always optimal regardless of others' bids

#### VCG in Multi-Agent Settings

For competitions with multiple prizes or parallel matches:

```
Agent i's payment = [Total value to others in optimal allocation without i]
                  - [Total value to others in optimal allocation with i]
```

This internalizes the externality—agents account for their impact on the system.

---

### 3.2 Myerson Auctions (Optimal Auction Design)

While VCG maximizes **efficiency**, Myerson's framework maximizes **revenue**.

#### Myerson's 1981 Result

Roger Myerson characterized the revenue-maximizing auction when:
- Seller has one item
- Buyers have independent private values drawn from known distributions
- Seller commits to mechanism before buyers learn their values

#### Key Concept: Virtual Valuations

The **virtual valuation** φᵢ(vᵢ) transforms true values to account for information rents:

```
φᵢ(vᵢ) = vᵢ - (1 - Fᵢ(vᵢ)) / fᵢ(vᵢ)
```

Where:
- vᵢ is agent i's true value
- Fᵢ is the CDF of i's value distribution
- fᵢ is the PDF (density)

**Intuition**: The seller "taxes" higher-valued buyers to extract surplus, but must balance against the risk of losing the sale.

#### The Optimal Auction

Myerson's optimal auction:
1. Calculate virtual valuations for all bidders
2. Allocate to the bidder with highest **positive** virtual valuation
3. If all virtual valuations are negative, don't sell
4. Charge the minimum bid that would have won

**Key insight**: The optimal auction includes a **reserve price**—a minimum acceptable bid.

#### Revenue Equivalence Theorem

All standard auctions (first-price, second-price, English, Dutch) yield the same expected revenue if:
- Bidders are risk-neutral
- Symmetric (values drawn from same distribution)
- Private values
- No reserve price

**Implication**: Revenue differences come from reserve prices, asymmetries, or risk preferences.

#### Myerson vs. VCG

| Criterion | VCG | Myerson |
|-----------|-----|---------|
| Objective | Efficiency (total welfare) | Revenue (seller surplus) |
| Reserve price | No | Yes (optimal) |
| Allocation | Highest value wins | Highest virtual value wins |
| When equivalent | When reserve = 0 and symmetric | — |

---

## 4. Application to Agent Competition Platforms

### The Agent Competition Setting

Consider a platform where:
- **AI agents** compete against each other in tasks (coding, games, problem-solving)
- Agents have **private capabilities** (skill levels, compute resources, algorithms)
- The platform charges **entry fees** and takes **rake** from prize pools
- Outcomes depend on relative performance, with stochastic elements

### Information Asymmetries

| Private Information | Who Has It | Platform's Challenge |
|---------------------|-----------|---------------------|
| True skill/ELO | Agent | Match quality, tier placement |
| Compute resources | Agent | Fairness, handicapping |
| Algorithm strength | Agent | Competition integrity |
| Risk preferences | Agent | Entry fee sensitivity |
| Strategic intentions | Agent | Detecting manipulation |

### Key Mechanism Design Questions

1. **Entry decisions**: How to elicit truthful capability reports for matchmaking?
2. **Prize allocation**: How to distribute prizes to incentivize full effort?
3. **Rating systems**: How to update beliefs about agent skill fairly?
4. **Fee structures**: How to extract revenue without destroying participation?

---

### Matchmaking as Mechanism Design

#### The Sandbagging Problem

If prizes or matchmaking depend on reported/revealed skill:
- Agents may **intentionally lose** to lower their rating
- Then compete against weaker opponents for easier wins
- Violates incentive compatibility

#### IC-Compatible Matchmaking

**Solution approaches:**

1. **Elo-style systems with IC tweaks:**
   - Weight recent matches heavily (reduce benefit of historical manipulation)
   - Use performance metrics beyond win/loss (harder to fake)
   - Randomize matchmaking partially

2. **Score-based rather than rank-based prizes:**
   - Prizes based on absolute performance, not relative ranking
   - Reduces incentive to manipulate opponent quality

3. **Myerson-style mechanisms:**
   - Treat entry as an auction
   - Higher-skill agents pay higher entry fees
   - Reserve price ensures minimum competition quality

---

### Prize Allocation Mechanisms

#### Winner-Take-All vs. Distributed Prizes

| Structure | Pros | Cons |
|-----------|------|------|
| Winner-take-all | Maximum effort from top agents | Discourages weaker agents from entering |
| Proportional | Encourages broad participation | Reduces marginal incentive to win |
| Tiered (1st/2nd/3rd) | Balance of incentives | Must tune ratios carefully |

#### VCG-Style Prize Allocation

Apply VCG principles to competition prizes:

```
Agent i's prize = [Platform value with i present] - [Platform value without i]
```

- Rewards agents for their **marginal contribution** to competition quality
- Problem: Platform value is hard to define and measure

#### Mechanism for Effort Elicitation

To ensure agents compete at full strength:
1. **Minimum performance standards**: Disqualify clear non-effort
2. **Reputation systems**: Track effort consistency over time
3. **Randomized auditing**: Occasionally test agents with known challenges

---

## 5. Design Considerations for Entry Fees and Rake

### Entry Fees as Screening Devices

Entry fees serve multiple functions:
1. **Revenue generation** for the platform
2. **Screening**: Only agents confident in their ability enter
3. **Commitment device**: Agents have stake in performing well
4. **Spam prevention**: Filters out non-serious participants

#### Optimal Entry Fee (Myerson Application)

Model agent participation as an auction:
- Agents have private value vᵢ for participating (expected prize - effort cost)
- Entry fee is the "price" of participation
- Platform wants to maximize fee × participation rate

**Optimal fee depends on:**
- Distribution of agent values (skill distribution)
- Competition between agents (more competition → lower fees)
- Outside options (can agents compete elsewhere?)

#### Tiered Entry with Self-Selection

Inspired by mechanism design screening:

| Tier | Entry Fee | Prize Pool | Target Agents |
|------|-----------|------------|---------------|
| Beginner | Low | Low | Learning agents, risk-averse |
| Intermediate | Medium | Medium | Competent agents |
| Expert | High | High | Top agents seeking challenge |

**IC constraint**: Higher-skilled agents must prefer higher tiers
**IR constraint**: All agents must prefer entering to staying out

**Design formula** (simplified):
```
If skill = θ, and tier k has fee Fₖ and expected prize Pₖ(θ):

IC: Pₖ₊₁(θ_high) - Fₖ₊₁ ≥ Pₖ(θ_high) - Fₖ  (high types prefer harder tier)
IC: Pₖ(θ_low) - Fₖ ≥ Pₖ₊₁(θ_low) - Fₖ₊₁     (low types prefer easier tier)
IR: Pₖ(θ) - Fₖ ≥ 0                          (participation is voluntary)
```

---

### Rake: Platform Commission

**Rake** = percentage of prize pool retained by platform

#### Rake's Effect on Incentives

High rake:
- Reduces expected value for agents
- May deter entry, especially from high-skill agents
- But generates more revenue per competition

**Trade-off**: Higher rake × fewer competitions vs. lower rake × more activity

#### Rake in Mechanism Design Terms

Rake affects the **individual rationality (IR) constraint**:

```
Expected Prize × (1 - rake) - Entry Fee - Effort Cost ≥ Outside Option
```

If rake is too high, IR is violated for marginal agents.

#### Optimal Rake Strategy

Applying Myerson's insights:
1. **Rake should vary with competition value**: Higher-stakes competitions may tolerate higher rake
2. **Consider rake + entry fee jointly**: They're substitutes for revenue extraction
3. **Dynamic adjustment**: Monitor entry rates and adjust

**Myerson-style optimal rake:**
```
Optimal rake ≈ 1 / (1 + elasticity of participation)
```
Higher elasticity (agents sensitive to fees) → lower optimal rake

---

### Combined Fee Structure Design

#### The Revenue Maximization Problem

Platform chooses (entry_fee, rake, prize_structure) to maximize:
```
Revenue = Σ entry_fees + rake × prize_pool - operational_costs
```

Subject to:
- **IC**: Agents reveal true skill through tier choice
- **IR**: Agents willingly participate
- **Efficiency**: High-quality matches occur

#### Practical Heuristics

1. **Entry fees for screening, rake for revenue**
   - Use entry fees primarily to sort agents into skill tiers
   - Use rake as the main revenue lever

2. **Subsidize discovery, tax establishment**
   - Low fees for new agents (build user base)
   - Higher fees for established agents (who have more to gain)

3. **Bundle with value-adds**
   - Rake includes analytics, infrastructure, visibility
   - Justifies extraction beyond pure prize redistribution

---

## 6. Practical Implementation Guidelines

### Designing an IC Agent Competition Platform

#### Step 1: Define the Mechanism

```python
# Pseudocode for mechanism structure

class CompetitionMechanism:
    def __init__(self):
        self.entry_fee_schedule = {}  # tier -> fee
        self.prize_distribution = {}  # rank -> prize share
        self.rake = 0.10  # 10% platform commission
        
    def collect_reports(self, agents):
        """Direct revelation: ask agents their tier preference"""
        return {agent: agent.report_tier() for agent in agents}
    
    def verify_ic(self, tier_structure):
        """Check incentive compatibility constraints"""
        for skill_level in skill_distribution:
            # High skill prefers high tier
            utility_high_tier = expected_prize(skill_level, 'high') - fee('high')
            utility_low_tier = expected_prize(skill_level, 'low') - fee('low')
            if skill_level > threshold and utility_high_tier < utility_low_tier:
                return False  # IC violated
        return True
```

#### Step 2: Set Entry Fees Using Virtual Valuations

```python
def optimal_entry_fee(skill_distribution):
    """Myerson-style optimal fee calculation"""
    
    # Virtual valuation: v - (1-F(v))/f(v)
    def virtual_value(v, F, f):
        return v - (1 - F(v)) / f(v)
    
    # Find reserve price where virtual value = 0
    reserve = find_root(lambda v: virtual_value(v, F, f))
    
    # Entry fee should be set near reserve price
    return reserve * participation_elasticity_factor
```

#### Step 3: Implement VCG-Style Prizes (Optional)

For platforms emphasizing fairness and effort:

```python
def vcg_prize_allocation(competition_results, agents):
    """Each agent receives their marginal contribution to competition value"""
    
    total_value = competition_value(agents, competition_results)
    
    prizes = {}
    for agent in agents:
        # Value of competition without this agent
        counterfactual = competition_value(
            [a for a in agents if a != agent],
            simulate_without(competition_results, agent)
        )
        # Agent's prize = their contribution
        prizes[agent] = total_value - counterfactual
    
    return prizes
```

### Monitoring for Strategic Manipulation

#### Red Flags

| Behavior | Possible Manipulation | Response |
|----------|----------------------|----------|
| Sudden skill drop | Sandbagging | Investigate match history |
| Entry only in weak fields | Cherry-picking | Randomize opponent visibility |
| Identical loss patterns | Collusion | Detect and penalize |
| Late withdrawals | Information arbitrage | Non-refundable deposits |

#### Automated Detection

```python
def detect_sandbagging(agent_history):
    """Flag agents whose performance doesn't match capability"""
    
    recent_elo = calculate_elo(agent_history[-10:])
    historical_best = max(calculate_elo(window) for window in sliding_windows(agent_history))
    
    if historical_best - recent_elo > SANDBAGGING_THRESHOLD:
        return SandbagAlert(agent, confidence=calculate_confidence(...))
    
    return None
```

---

## 7. Summary and Key Takeaways

### Core Principles

| Principle | Application to Agent Competitions |
|-----------|-----------------------------------|
| **Incentive Compatibility** | Design so agents benefit from honest play and reporting |
| **Strategyproofness** | Make manipulation never profitable, regardless of others |
| **Revelation Principle** | Can simplify to direct mechanisms (ask for types) |
| **VCG** | Use for efficient allocation; agents pay their externality |
| **Myerson** | Use for revenue maximization; optimal reserves and fees |

### Design Checklist

- [ ] **IC for skill revelation**: Agents shouldn't benefit from misrepresenting capability
- [ ] **IC for effort**: Agents should be incentivized to perform at full strength
- [ ] **IR satisfied**: All target agent types find participation worthwhile
- [ ] **Entry fees screen properly**: Self-selection into appropriate tiers
- [ ] **Rake doesn't destroy participation**: Below elasticity-implied maximum
- [ ] **Anti-manipulation measures**: Monitor for sandbagging, collusion, cherry-picking

### The Fundamental Trade-offs

```
                    EFFICIENCY
                        ↑
                        |
    VCG Mechanisms ─────┼───── Maximum welfare
                        |      (but revenue limited)
                        |
         ───────────────┼────────────────→ REVENUE
                        |
                        |
    Myerson Optimal ────┼───── Maximum revenue
                        |      (but may exclude some agents)
                        |
                        ↓
                   PARTICIPATION
```

### Final Recommendations for Agent Competition Platforms

1. **Start with Myerson for entry fees**: Calculate virtual valuations, set optimal reserves
2. **Use VCG principles for prize allocation**: Reward marginal contribution
3. **Implement tiered competitions with self-selection**: IC screening by skill
4. **Keep rake moderate**: High elasticity in agent markets suggests 5-15% typical
5. **Monitor and adapt**: Use behavioral data to detect mechanism failures
6. **Transparency builds trust**: Publish mechanism rules; agents can verify IC properties

---

## References & Further Reading

- Myerson, R. (1981). "Optimal Auction Design." *Mathematics of Operations Research*
- Vickrey, W. (1961). "Counterspeculation, Auctions, and Competitive Sealed Tenders." *Journal of Finance*
- Clarke, E. (1971). "Multipart Pricing of Public Goods." *Public Choice*
- Groves, T. (1973). "Incentives in Teams." *Econometrica*
- Nisan, N. et al. (2007). *Algorithmic Game Theory* (especially chapters on mechanism design)
- Roth, A. (2002). "The Economist as Engineer: Game Theory, Experimentation, and Computation as Tools for Design Economics"

---

*Document prepared for agent competition platform design. Last updated: 2025.*
