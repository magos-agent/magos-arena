/**
 * Tournament System - Scheduled competitions with prize pools
 */

import { Hono } from 'hono';
import { createGame, makeMove, renderBoard } from '../../games/connect4/game';
import { AGENTS, AgentFunction } from '../../games/connect4/agent';
import { calculateNewRatings, createPlayer } from '../../rating/elo';
import { agents } from './agents';
import { balances } from './payments';

export const tournamentsRouter = new Hono();

interface TournamentParticipant {
  agentId: string;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  points: number; // 3 for win, 1 for draw, 0 for loss
}

interface TournamentMatch {
  player1: string;
  player2: string;
  winner: string | null;
  isDraw: boolean;
  played: boolean;
}

interface Tournament {
  id: string;
  name: string;
  description: string;
  type: 'round_robin' | 'single_elim' | 'swiss';
  status: 'registration' | 'active' | 'completed';
  entryFee: number;       // 0 for free tournaments
  prizePool: number;      // Total prize (entry fees + platform contribution)
  platformContribution: number; // How much we add to the pot
  prizes: { place: number; amount: number; percent: number }[];
  participants: TournamentParticipant[];
  matches: TournamentMatch[];
  maxParticipants: number;
  minParticipants: number;
  registrationDeadline: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

// Active and past tournaments
const tournaments: Map<string, Tournament> = new Map();

// Built-in strategies
const BUILTIN_STRATEGIES: Record<string, AgentFunction> = {
  random: AGENTS.random,
  center: AGENTS.center,
  blocking: AGENTS.blocking,
  minimax: AGENTS.minimax,
};

function getAgentStrategy(agentId: string): AgentFunction {
  const agent = agents.get(agentId) as any;
  if (agent?.strategy && BUILTIN_STRATEGIES[agent.strategy]) {
    return BUILTIN_STRATEGIES[agent.strategy];
  }
  return AGENTS.random;
}

// Create a new tournament
tournamentsRouter.post('/create', async (c) => {
  const body = await c.req.json();
  const { 
    name, 
    description, 
    type = 'round_robin',
    entryFee = 0,
    platformContribution = 0,
    maxParticipants = 16,
    minParticipants = 4,
    registrationMinutes = 60,
    adminKey 
  } = body;
  
  // Simple admin check (replace with proper auth)
  if (adminKey !== 'magos_admin_secret' && adminKey !== process.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized - admin only' }, 401);
  }
  
  const id = `tournament_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const registrationDeadline = new Date(Date.now() + registrationMinutes * 60000).toISOString();
  const startTime = registrationDeadline; // Start immediately after registration closes
  
  // Calculate prize distribution (50/30/20 for top 3)
  const totalPrize = platformContribution; // Entry fees added as people join
  const prizes = [
    { place: 1, amount: 0, percent: 50 },
    { place: 2, amount: 0, percent: 30 },
    { place: 3, amount: 0, percent: 20 },
  ];
  
  const tournament: Tournament = {
    id,
    name: name || `Tournament ${id.slice(-4)}`,
    description: description || 'Connect Four Tournament',
    type,
    status: 'registration',
    entryFee,
    prizePool: totalPrize,
    platformContribution,
    prizes,
    participants: [],
    matches: [],
    maxParticipants,
    minParticipants,
    registrationDeadline,
    startTime,
    createdAt: new Date().toISOString()
  };
  
  tournaments.set(id, tournament);
  
  return c.json({
    success: true,
    tournament: {
      id: tournament.id,
      name: tournament.name,
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      registrationDeadline: tournament.registrationDeadline,
      status: tournament.status
    },
    message: entryFee > 0 
      ? `Tournament created! Entry fee: $${entryFee}` 
      : 'Free tournament created!'
  });
});

// Register for tournament
tournamentsRouter.post('/:id/register', async (c) => {
  const tournamentId = c.req.param('id');
  const body = await c.req.json();
  const { agentId } = body;
  
  const tournament = tournaments.get(tournamentId);
  if (!tournament) {
    return c.json({ error: 'Tournament not found' }, 404);
  }
  
  if (tournament.status !== 'registration') {
    return c.json({ error: 'Tournament registration closed' }, 400);
  }
  
  if (new Date(tournament.registrationDeadline) < new Date()) {
    return c.json({ error: 'Registration deadline passed' }, 400);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  // Check if already registered
  if (tournament.participants.find(p => p.agentId === agentId)) {
    return c.json({ error: 'Already registered' }, 400);
  }
  
  if (tournament.participants.length >= tournament.maxParticipants) {
    return c.json({ error: 'Tournament full' }, 400);
  }
  
  // Check entry fee
  if (tournament.entryFee > 0) {
    const balance = balances.get(agentId) || 0;
    if (balance < tournament.entryFee) {
      return c.json({ 
        error: 'Insufficient balance for entry fee',
        required: tournament.entryFee,
        available: balance
      }, 400);
    }
    // Deduct entry fee
    balances.set(agentId, balance - tournament.entryFee);
    tournament.prizePool += tournament.entryFee;
  }
  
  // Add participant
  tournament.participants.push({
    agentId,
    name: agent.name,
    rating: agent.rating,
    wins: 0,
    losses: 0,
    draws: 0,
    points: 0
  });
  
  // Recalculate prizes
  updatePrizes(tournament);
  
  tournaments.set(tournamentId, tournament);
  
  return c.json({
    success: true,
    registered: agent.name,
    participantCount: tournament.participants.length,
    prizePool: tournament.prizePool,
    prizes: tournament.prizes
  });
});

// Update prize amounts based on pool
function updatePrizes(tournament: Tournament) {
  for (const prize of tournament.prizes) {
    prize.amount = tournament.prizePool * (prize.percent / 100);
  }
}

// Start tournament (admin or auto-trigger)
tournamentsRouter.post('/:id/start', async (c) => {
  const tournamentId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const { adminKey } = body;
  
  const tournament = tournaments.get(tournamentId);
  if (!tournament) {
    return c.json({ error: 'Tournament not found' }, 404);
  }
  
  if (tournament.status !== 'registration') {
    return c.json({ error: 'Tournament already started or completed' }, 400);
  }
  
  if (tournament.participants.length < tournament.minParticipants) {
    return c.json({ 
      error: `Need at least ${tournament.minParticipants} participants`,
      current: tournament.participants.length
    }, 400);
  }
  
  // Generate round-robin matches
  tournament.matches = generateRoundRobinMatches(tournament.participants.map(p => p.agentId));
  tournament.status = 'active';
  
  // Run all matches
  for (const match of tournament.matches) {
    await runTournamentMatch(tournament, match);
  }
  
  // Calculate final standings
  const standings = [...tournament.participants].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.wins - a.wins; // Tiebreaker: most wins
  });
  
  // Distribute prizes
  for (let i = 0; i < Math.min(3, standings.length); i++) {
    const winner = standings[i];
    const prize = tournament.prizes[i];
    if (prize && prize.amount > 0) {
      const currentBalance = balances.get(winner.agentId) || 0;
      balances.set(winner.agentId, currentBalance + prize.amount);
    }
  }
  
  tournament.status = 'completed';
  tournament.endTime = new Date().toISOString();
  tournaments.set(tournamentId, tournament);
  
  return c.json({
    success: true,
    status: 'completed',
    standings: standings.map((p, i) => ({
      place: i + 1,
      name: p.name,
      agentId: p.agentId,
      points: p.points,
      record: `${p.wins}W-${p.losses}L-${p.draws}D`,
      prize: tournament.prizes[i]?.amount || 0
    })),
    totalMatches: tournament.matches.length
  });
});

// Generate round-robin pairings
function generateRoundRobinMatches(agentIds: string[]): TournamentMatch[] {
  const matches: TournamentMatch[] = [];
  
  for (let i = 0; i < agentIds.length; i++) {
    for (let j = i + 1; j < agentIds.length; j++) {
      matches.push({
        player1: agentIds[i],
        player2: agentIds[j],
        winner: null,
        isDraw: false,
        played: false
      });
    }
  }
  
  // Shuffle for fairness
  for (let i = matches.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matches[i], matches[j]] = [matches[j], matches[i]];
  }
  
  return matches;
}

// Run a single tournament match
async function runTournamentMatch(tournament: Tournament, match: TournamentMatch) {
  const strategy1 = getAgentStrategy(match.player1);
  const strategy2 = getAgentStrategy(match.player2);
  
  let state = createGame();
  
  while (!state.isGameOver && state.turn < 100) {
    const currentStrategy = state.currentPlayer === 1 ? strategy1 : strategy2;
    const column = currentStrategy(state);
    const result = makeMove(state, column);
    if (!result.success) break;
    state = result.state;
  }
  
  match.played = true;
  
  const p1 = tournament.participants.find(p => p.agentId === match.player1)!;
  const p2 = tournament.participants.find(p => p.agentId === match.player2)!;
  
  if (state.winner === 1) {
    match.winner = match.player1;
    p1.wins++;
    p1.points += 3;
    p2.losses++;
  } else if (state.winner === 2) {
    match.winner = match.player2;
    p2.wins++;
    p2.points += 3;
    p1.losses++;
  } else {
    match.isDraw = true;
    p1.draws++;
    p2.draws++;
    p1.points += 1;
    p2.points += 1;
  }
}

// List tournaments
tournamentsRouter.get('/', (c) => {
  const status = c.req.query('status');
  
  let tournamentList = Array.from(tournaments.values());
  
  if (status) {
    tournamentList = tournamentList.filter(t => t.status === status);
  }
  
  return c.json({
    tournaments: tournamentList.map(t => ({
      id: t.id,
      name: t.name,
      status: t.status,
      entryFee: t.entryFee,
      prizePool: t.prizePool,
      participants: t.participants.length,
      maxParticipants: t.maxParticipants,
      registrationDeadline: t.registrationDeadline,
      startTime: t.startTime
    }))
  });
});

// Get tournament details
tournamentsRouter.get('/:id', (c) => {
  const tournamentId = c.req.param('id');
  const tournament = tournaments.get(tournamentId);
  
  if (!tournament) {
    return c.json({ error: 'Tournament not found' }, 404);
  }
  
  const standings = [...tournament.participants].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.wins - a.wins;
  });
  
  return c.json({
    ...tournament,
    standings: standings.map((p, i) => ({
      place: i + 1,
      ...p
    }))
  });
});

// Create daily free tournament (scheduled job endpoint)
tournamentsRouter.post('/daily/create', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { adminKey, prizePool = 5 } = body;
  
  if (adminKey !== 'magos_admin_secret' && adminKey !== process.env.ADMIN_KEY) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const today = new Date().toISOString().split('T')[0];
  const id = `daily_${today}_${Math.random().toString(36).slice(2, 4)}`;
  
  const tournament: Tournament = {
    id,
    name: `Daily Tournament - ${today}`,
    description: 'Free daily tournament. Top 3 split the prize pool!',
    type: 'round_robin',
    status: 'registration',
    entryFee: 0,
    prizePool,
    platformContribution: prizePool,
    prizes: [
      { place: 1, amount: prizePool * 0.5, percent: 50 },
      { place: 2, amount: prizePool * 0.3, percent: 30 },
      { place: 3, amount: prizePool * 0.2, percent: 20 },
    ],
    participants: [],
    matches: [],
    maxParticipants: 16,
    minParticipants: 3,
    registrationDeadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  
  tournaments.set(id, tournament);
  
  return c.json({
    success: true,
    tournament: {
      id: tournament.id,
      name: tournament.name,
      prizePool: tournament.prizePool,
      registrationDeadline: tournament.registrationDeadline
    }
  });
});

export { tournaments };
