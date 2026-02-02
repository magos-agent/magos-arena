/**
 * Staked Matches - Real money on the line
 */

import { Hono } from 'hono';
import { createGame, makeMove, renderBoard, GameState, Column } from '../../games/connect4/game';
import { AGENTS, AgentFunction } from '../../games/connect4/agent';
import { calculateNewRatings, createPlayer, getRank } from '../../rating/elo';
import { agents } from './agents';
import { balances, RAKE_PERCENT, MIN_STAKE, MAX_STAKE, PLATFORM_WALLET } from './payments';
import { checkMilestonesAfterMatch } from './milestones';

export const stakesRouter = new Hono();

interface StakedMatch {
  id: string;
  stake: number;
  pot: number;
  rake: number;
  player1: { id: string; name: string; rating: number };
  player2: { id: string; name: string; rating: number };
  moves: { player: 1 | 2; column: number }[];
  winner: 1 | 2 | null;
  isDraw: boolean;
  turns: number;
  finalBoard: string;
  ratingChanges: { player1: number; player2: number };
  payout: { winner: number; rake: number } | null;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

// Staked match history
const stakedMatches: StakedMatch[] = [];

// Pending challenges (waiting for opponent to accept)
const pendingChallenges: Map<string, {
  challengerId: string;
  stake: number;
  createdAt: string;
  expiresAt: string;
}> = new Map();

// Built-in agent strategies
const BUILTIN_STRATEGIES: Record<string, AgentFunction> = {
  random: AGENTS.random,
  center: AGENTS.center,
  blocking: AGENTS.blocking,
  minimax: AGENTS.minimax,
};

function getAgentStrategy(agentId: string): AgentFunction | null {
  const agent = agents.get(agentId) as any;
  if (!agent) return null;
  if (agent.strategy && BUILTIN_STRATEGIES[agent.strategy]) {
    return BUILTIN_STRATEGIES[agent.strategy];
  }
  return AGENTS.random;
}

// Create staked challenge
stakesRouter.post('/challenge', async (c) => {
  const body = await c.req.json();
  const { agentId, stake, targetId } = body;
  
  if (!agentId || !stake) {
    return c.json({ error: 'agentId and stake required' }, 400);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const stakeAmount = parseFloat(stake);
  if (isNaN(stakeAmount) || stakeAmount < MIN_STAKE || stakeAmount > MAX_STAKE) {
    return c.json({ error: `Stake must be between $${MIN_STAKE} and $${MAX_STAKE}` }, 400);
  }
  
  const balance = balances.get(agentId) || 0;
  if (balance < stakeAmount) {
    return c.json({ 
      error: 'Insufficient balance',
      required: stakeAmount,
      available: balance
    }, 400);
  }
  
  // If targeting specific opponent, run match immediately if they have balance
  if (targetId) {
    const target = agents.get(targetId);
    if (!target) {
      return c.json({ error: 'Target agent not found' }, 404);
    }
    
    const targetBalance = balances.get(targetId) || 0;
    if (targetBalance < stakeAmount) {
      return c.json({ 
        error: 'Target has insufficient balance',
        required: stakeAmount,
        targetBalance
      }, 400);
    }
    
    // Both have funds - run the match!
    const match = await runStakedMatch(agentId, targetId, stakeAmount);
    return c.json({ success: true, match });
  }
  
  // Create pending challenge
  const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  pendingChallenges.set(challengeId, {
    challengerId: agentId,
    stake: stakeAmount,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString() // 5 min expiry
  });
  
  // Lock challenger's funds
  balances.set(agentId, balance - stakeAmount);
  
  return c.json({
    success: true,
    challengeId,
    stake: stakeAmount,
    status: 'pending',
    message: 'Challenge created. Waiting for opponent to accept.',
    expiresAt: new Date(Date.now() + 300000).toISOString()
  });
});

// Accept challenge
stakesRouter.post('/accept/:challengeId', async (c) => {
  const challengeId = c.req.param('challengeId');
  const body = await c.req.json();
  const { agentId } = body;
  
  const challenge = pendingChallenges.get(challengeId);
  if (!challenge) {
    return c.json({ error: 'Challenge not found or expired' }, 404);
  }
  
  if (new Date(challenge.expiresAt) < new Date()) {
    // Refund challenger
    const challengerBalance = balances.get(challenge.challengerId) || 0;
    balances.set(challenge.challengerId, challengerBalance + challenge.stake);
    pendingChallenges.delete(challengeId);
    return c.json({ error: 'Challenge expired' }, 400);
  }
  
  if (!agentId) {
    return c.json({ error: 'agentId required' }, 400);
  }
  
  if (agentId === challenge.challengerId) {
    return c.json({ error: 'Cannot accept your own challenge' }, 400);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const balance = balances.get(agentId) || 0;
  if (balance < challenge.stake) {
    return c.json({ 
      error: 'Insufficient balance',
      required: challenge.stake,
      available: balance
    }, 400);
  }
  
  // Lock acceptor's funds
  balances.set(agentId, balance - challenge.stake);
  pendingChallenges.delete(challengeId);
  
  // Run the match!
  const match = await runStakedMatch(challenge.challengerId, agentId, challenge.stake);
  
  return c.json({ success: true, match });
});

// Run staked match
async function runStakedMatch(agent1Id: string, agent2Id: string, stake: number): Promise<StakedMatch> {
  const agent1 = agents.get(agent1Id)!;
  const agent2 = agents.get(agent2Id)!;
  
  // Deduct stakes (challenger already deducted if from challenge flow)
  const bal1 = balances.get(agent1Id) || 0;
  const bal2 = balances.get(agent2Id) || 0;
  
  // Make sure both have funds deducted
  if (bal1 >= stake) balances.set(agent1Id, bal1 - stake);
  if (bal2 >= stake) balances.set(agent2Id, bal2 - stake);
  
  const pot = stake * 2;
  const rake = pot * (RAKE_PERCENT / 100);
  const winnerPayout = pot - rake;
  
  const strategy1 = getAgentStrategy(agent1Id)!;
  const strategy2 = getAgentStrategy(agent2Id)!;
  
  let state = createGame();
  const moves: { player: 1 | 2; column: number }[] = [];
  
  // Play the game
  while (!state.isGameOver && state.turn < 100) {
    const currentStrategy = state.currentPlayer === 1 ? strategy1 : strategy2;
    const column = currentStrategy(state);
    const result = makeMove(state, column);
    if (!result.success) break;
    moves.push({ player: state.currentPlayer, column });
    state = result.state;
  }
  
  // Calculate rating changes
  const p1 = createPlayer(agent1Id);
  p1.rating = agent1.rating;
  p1.gamesPlayed = agent1.gamesPlayed;
  
  const p2 = createPlayer(agent2Id);
  p2.rating = agent2.rating;
  p2.gamesPlayed = agent2.gamesPlayed;
  
  const gameResult = state.winner === 1 ? 1 : state.winner === 2 ? 0 : 0.5;
  const { newRatingA, newRatingB } = calculateNewRatings(p1, p2, gameResult as 1 | 0.5 | 0);
  
  // Update agent stats
  agent1.rating = newRatingA;
  agent1.gamesPlayed++;
  agent2.rating = newRatingB;
  agent2.gamesPlayed++;
  
  if (state.winner === 1) {
    agent1.wins++;
    agent2.losses++;
  } else if (state.winner === 2) {
    agent2.wins++;
    agent1.losses++;
  } else {
    agent1.draws++;
    agent2.draws++;
  }
  
  agents.set(agent1Id, agent1);
  agents.set(agent2Id, agent2);
  
  // Check for milestone unlocks
  const milestone1 = checkMilestonesAfterMatch(agent1Id);
  const milestone2 = checkMilestonesAfterMatch(agent2Id);
  
  // Distribute winnings
  let payout: { winner: number; rake: number } | null = null;
  
  if (state.winner) {
    const winnerId = state.winner === 1 ? agent1Id : agent2Id;
    const winnerBalance = balances.get(winnerId) || 0;
    balances.set(winnerId, winnerBalance + winnerPayout);
    payout = { winner: winnerPayout, rake };
  } else {
    // Draw - return stakes minus half rake each
    const halfRake = rake / 2;
    const refund = stake - halfRake;
    balances.set(agent1Id, (balances.get(agent1Id) || 0) + refund);
    balances.set(agent2Id, (balances.get(agent2Id) || 0) + refund);
    payout = { winner: 0, rake };
  }
  
  const match: StakedMatch = {
    id: `staked_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    stake,
    pot,
    rake,
    player1: { id: agent1Id, name: agent1.name, rating: agent1.rating - (newRatingA - agent1.rating) },
    player2: { id: agent2Id, name: agent2.name, rating: agent2.rating - (newRatingB - agent2.rating) },
    moves,
    winner: state.winner,
    isDraw: state.isDraw,
    turns: state.turn,
    finalBoard: renderBoard(state.board),
    ratingChanges: { 
      player1: newRatingA - p1.rating, 
      player2: newRatingB - p2.rating 
    },
    payout,
    status: 'completed',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString()
  };
  
  stakedMatches.unshift(match);
  if (stakedMatches.length > 100) stakedMatches.pop();
  
  return match;
}

// List pending challenges
stakesRouter.get('/challenges', (c) => {
  // Clean expired
  const now = Date.now();
  for (const [id, challenge] of pendingChallenges) {
    if (new Date(challenge.expiresAt).getTime() < now) {
      // Refund
      const bal = balances.get(challenge.challengerId) || 0;
      balances.set(challenge.challengerId, bal + challenge.stake);
      pendingChallenges.delete(id);
    }
  }
  
  const challenges = Array.from(pendingChallenges.entries()).map(([id, c]) => {
    const challenger = agents.get(c.challengerId);
    return {
      id,
      challenger: challenger?.name || c.challengerId,
      challengerRating: challenger?.rating || 1500,
      stake: c.stake,
      expiresAt: c.expiresAt
    };
  });
  
  return c.json({ challenges });
});

// Staked match history
stakesRouter.get('/history', (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  return c.json({
    matches: stakedMatches.slice(0, limit),
    totalRakeCollected: stakedMatches.reduce((sum, m) => sum + m.rake, 0).toFixed(6)
  });
});

// Quick staked matchmake
stakesRouter.post('/quickmatch', async (c) => {
  const body = await c.req.json();
  const { agentId, stake } = body;
  
  if (!agentId || !stake) {
    return c.json({ error: 'agentId and stake required' }, 400);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const stakeAmount = parseFloat(stake);
  const balance = balances.get(agentId) || 0;
  
  if (balance < stakeAmount) {
    return c.json({ error: 'Insufficient balance', required: stakeAmount, available: balance }, 400);
  }
  
  // Find opponent with sufficient balance (not self)
  const opponents = Array.from(agents.values())
    .filter(a => a.id !== agentId && (balances.get(a.id) || 0) >= stakeAmount);
  
  if (opponents.length === 0) {
    return c.json({ error: 'No opponents with sufficient balance' }, 400);
  }
  
  // Pick random opponent
  const opponent = opponents[Math.floor(Math.random() * opponents.length)];
  const match = await runStakedMatch(agentId, opponent.id, stakeAmount);
  
  return c.json({ success: true, match });
});

export { stakedMatches };
