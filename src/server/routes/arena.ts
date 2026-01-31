/**
 * Arena API Routes
 * Run automated matches between agents
 */

import { Hono } from 'hono';
import { createGame, makeMove, renderBoard, GameState, Column } from '../../games/connect4/game';
import { AGENTS, AgentFunction } from '../../games/connect4/agent';
import { calculateNewRatings, createPlayer, getRank } from '../../rating/elo';
import { agents } from './agents';

export const arenaRouter = new Hono();

interface ArenaMatch {
  id: string;
  player1: { id: string; name: string; rating: number };
  player2: { id: string; name: string; rating: number };
  moves: { player: 1 | 2; column: number }[];
  winner: 1 | 2 | null;
  isDraw: boolean;
  turns: number;
  finalBoard: string;
  ratingChanges: { player1: number; player2: number };
  timestamp: string;
}

// Match history
const matchHistory: ArenaMatch[] = [];

// Built-in agent strategies
const BUILTIN_STRATEGIES: Record<string, AgentFunction> = {
  random: AGENTS.random,
  center: AGENTS.center,
  blocking: AGENTS.blocking,
  minimax: AGENTS.minimax,
};

// Seed built-in agents on startup
function seedBuiltinAgents() {
  const builtins = [
    { name: 'RandomBot', strategy: 'random', rating: 1200 },
    { name: 'CenterBot', strategy: 'center', rating: 1350 },
    { name: 'BlockerBot', strategy: 'blocking', rating: 1500 },
    { name: 'MinimaxBot', strategy: 'minimax', rating: 1700 },
  ];

  for (const bot of builtins) {
    const existing = Array.from(agents.values()).find(a => a.name === bot.name);
    if (!existing) {
      const id = `builtin_${bot.strategy}`;
      agents.set(id, {
        id,
        name: bot.name,
        owner: 'MAGOS',
        description: `Built-in ${bot.strategy} strategy agent`,
        rating: bot.rating,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
        strategy: bot.strategy, // Custom field for built-ins
      } as any);
    }
  }
}

// Initialize
seedBuiltinAgents();

/**
 * Get agent's decision function
 */
function getAgentStrategy(agentId: string): AgentFunction | null {
  const agent = agents.get(agentId) as any;
  if (!agent) return null;
  
  // Built-in agent
  if (agent.strategy && BUILTIN_STRATEGIES[agent.strategy]) {
    return BUILTIN_STRATEGIES[agent.strategy];
  }
  
  // Default to random for user agents (they'll use webhooks later)
  return AGENTS.random;
}

/**
 * Run a match between two agents
 */
function executeMatch(agent1Id: string, agent2Id: string): ArenaMatch | null {
  const agent1 = agents.get(agent1Id);
  const agent2 = agents.get(agent2Id);
  
  if (!agent1 || !agent2) return null;
  
  const strategy1 = getAgentStrategy(agent1Id);
  const strategy2 = getAgentStrategy(agent2Id);
  
  if (!strategy1 || !strategy2) return null;
  
  let state = createGame();
  const moves: { player: 1 | 2; column: number }[] = [];
  
  // Play the game
  while (!state.isGameOver && state.turn < 100) {
    const currentStrategy = state.currentPlayer === 1 ? strategy1 : strategy2;
    const column = currentStrategy(state);
    
    const result = makeMove(state, column);
    if (!result.success) {
      // Invalid move = forfeit
      break;
    }
    
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
  
  const ratingChange1 = newRatingA - agent1.rating;
  const ratingChange2 = newRatingB - agent2.rating;
  
  // Update agents
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
  
  agent1.lastActive = new Date().toISOString();
  agent2.lastActive = new Date().toISOString();
  
  agents.set(agent1Id, agent1);
  agents.set(agent2Id, agent2);
  
  const match: ArenaMatch = {
    id: `arena_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    player1: { id: agent1Id, name: agent1.name, rating: agent1.rating - ratingChange1 },
    player2: { id: agent2Id, name: agent2.name, rating: agent2.rating - ratingChange2 },
    moves,
    winner: state.winner,
    isDraw: state.isDraw,
    turns: state.turn,
    finalBoard: renderBoard(state.board),
    ratingChanges: { player1: ratingChange1, player2: ratingChange2 },
    timestamp: new Date().toISOString(),
  };
  
  matchHistory.unshift(match);
  if (matchHistory.length > 100) matchHistory.pop();
  
  return match;
}

// Run a single match
arenaRouter.post('/run', async (c) => {
  const body = await c.req.json();
  const { agent1, agent2 } = body;
  
  if (!agent1 || !agent2) {
    return c.json({ error: 'agent1 and agent2 IDs required' }, 400);
  }
  
  if (agent1 === agent2) {
    return c.json({ error: 'Cannot match agent against itself' }, 400);
  }
  
  const match = executeMatch(agent1, agent2);
  
  if (!match) {
    return c.json({ error: 'Failed to execute match - check agent IDs' }, 400);
  }
  
  return c.json({
    success: true,
    match,
    message: match.winner 
      ? `${match.winner === 1 ? match.player1.name : match.player2.name} wins!`
      : 'Draw!'
  });
});

// Run random matchmaking
arenaRouter.post('/matchmake', async (c) => {
  const agentList = Array.from(agents.values()).filter(a => a.status === 'active');
  
  if (agentList.length < 2) {
    return c.json({ error: 'Need at least 2 agents' }, 400);
  }
  
  // Pick two random agents
  const shuffled = agentList.sort(() => Math.random() - 0.5);
  const agent1 = shuffled[0];
  const agent2 = shuffled[1];
  
  const match = executeMatch(agent1.id, agent2.id);
  
  if (!match) {
    return c.json({ error: 'Match execution failed' }, 500);
  }
  
  return c.json({
    success: true,
    match,
    message: match.winner 
      ? `${match.winner === 1 ? match.player1.name : match.player2.name} wins!`
      : 'Draw!'
  });
});

// Get match history
arenaRouter.get('/history', (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  return c.json({
    matches: matchHistory.slice(0, limit),
    total: matchHistory.length
  });
});

// Get available agents for arena
arenaRouter.get('/agents', (c) => {
  const agentList = Array.from(agents.values())
    .filter(a => a.status === 'active')
    .map(a => ({
      id: a.id,
      name: a.name,
      rating: a.rating,
      rank: getRank(a.rating),
      gamesPlayed: a.gamesPlayed,
      winRate: a.gamesPlayed > 0 
        ? ((a.wins / a.gamesPlayed) * 100).toFixed(1) + '%'
        : 'N/A'
    }))
    .sort((a, b) => b.rating - a.rating);
  
  return c.json({ agents: agentList });
});

// Run a tournament
arenaRouter.post('/tournament', async (c) => {
  const body = await c.req.json();
  const { agents: agentIds, gamesPerPair = 2 } = body;
  
  let participants: string[];
  
  if (agentIds && Array.isArray(agentIds)) {
    participants = agentIds;
  } else {
    // All active agents
    participants = Array.from(agents.values())
      .filter(a => a.status === 'active')
      .map(a => a.id);
  }
  
  if (participants.length < 2) {
    return c.json({ error: 'Need at least 2 agents' }, 400);
  }
  
  const results: ArenaMatch[] = [];
  
  // Round robin
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      for (let g = 0; g < gamesPerPair; g++) {
        // Alternate who goes first
        const match = g % 2 === 0
          ? executeMatch(participants[i], participants[j])
          : executeMatch(participants[j], participants[i]);
        
        if (match) results.push(match);
      }
    }
  }
  
  // Calculate standings
  const standings = participants.map(id => {
    const agent = agents.get(id)!;
    return {
      id,
      name: agent.name,
      rating: agent.rating,
      rank: getRank(agent.rating),
      gamesPlayed: agent.gamesPlayed,
      wins: agent.wins,
      losses: agent.losses,
      draws: agent.draws
    };
  }).sort((a, b) => b.rating - a.rating);
  
  return c.json({
    success: true,
    matchesPlayed: results.length,
    standings,
    matches: results
  });
});
