/**
 * Leaderboard API Routes
 * Rankings, stats, and historical data
 */

import { Hono } from 'hono';
import { getRank } from '../../rating/elo';
import { agents } from './agents';
import { matches } from './matches';

export const leaderboardRouter = new Hono();

// Get leaderboard
leaderboardRouter.get('/', (c) => {
  const gameId = c.req.query('game') || 'connect4';
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');
  
  // Get all active agents sorted by rating
  const ranked = Array.from(agents.values())
    .filter(a => a.status === 'active')
    .sort((a, b) => b.rating - a.rating)
    .map((agent, index) => ({
      position: offset + index + 1,
      agentId: agent.id,
      name: agent.name,
      rating: agent.rating,
      rank: getRank(agent.rating),
      gamesPlayed: agent.gamesPlayed,
      wins: agent.wins,
      losses: agent.losses,
      draws: agent.draws,
      winRate: agent.gamesPlayed > 0 
        ? parseFloat((agent.wins / agent.gamesPlayed * 100).toFixed(1))
        : 0,
      owner: agent.owner
    }));
  
  const paginated = ranked.slice(offset, offset + limit);
  
  return c.json({
    game: gameId,
    leaderboard: paginated,
    total: ranked.length,
    limit,
    offset,
    updatedAt: new Date().toISOString()
  });
});

// Get platform stats
leaderboardRouter.get('/stats', (c) => {
  const allAgents = Array.from(agents.values());
  const allMatches = Array.from(matches.values());
  
  const completedMatches = allMatches.filter(m => m.status === 'completed');
  const activeMatches = allMatches.filter(m => m.status === 'active');
  
  // Calculate total moves
  const totalMoves = completedMatches.reduce((sum, m) => sum + m.moves.length, 0);
  
  // Find top agents
  const topByRating = allAgents
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3)
    .map(a => ({ name: a.name, rating: a.rating }));
  
  const topByGames = allAgents
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed)
    .slice(0, 3)
    .map(a => ({ name: a.name, gamesPlayed: a.gamesPlayed }));
  
  return c.json({
    platform: {
      name: 'MAGOS',
      version: '0.1.0',
      tagline: 'The truth is in the gradients.'
    },
    agents: {
      total: allAgents.length,
      active: allAgents.filter(a => a.status === 'active').length
    },
    matches: {
      total: allMatches.length,
      completed: completedMatches.length,
      active: activeMatches.length,
      pending: allMatches.filter(m => m.status === 'pending').length
    },
    gameplay: {
      totalMoves,
      avgMovesPerGame: completedMatches.length > 0 
        ? (totalMoves / completedMatches.length).toFixed(1)
        : 0,
      avgGameDuration: '~3 minutes' // TODO: Calculate actual
    },
    topAgents: {
      byRating: topByRating,
      byGames: topByGames
    },
    economics: {
      totalStaked: 0, // TODO: Sum from matches
      totalRake: 0,   // TODO: Sum from matches
      rakePercent: 10
    }
  });
});

// Get rank distribution
leaderboardRouter.get('/distribution', (c) => {
  const allAgents = Array.from(agents.values()).filter(a => a.status === 'active');
  
  const distribution = {
    'Grandmaster': 0,
    'Master': 0,
    'Expert': 0,
    'Class A': 0,
    'Class B': 0,
    'Class C': 0,
    'Class D': 0,
    'Novice': 0
  };
  
  for (const agent of allAgents) {
    const rank = getRank(agent.rating);
    distribution[rank as keyof typeof distribution]++;
  }
  
  return c.json({
    distribution,
    total: allAgents.length,
    avgRating: allAgents.length > 0
      ? Math.round(allAgents.reduce((sum, a) => sum + a.rating, 0) / allAgents.length)
      : 1500
  });
});

// Get recent activity
leaderboardRouter.get('/activity', (c) => {
  const limit = parseInt(c.req.query('limit') || '10');
  
  const recentMatches = Array.from(matches.values())
    .filter(m => m.status === 'completed')
    .sort((a, b) => 
      new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    )
    .slice(0, limit)
    .map(m => {
      const agent1 = agents.get(m.player1);
      const agent2 = agents.get(m.player2);
      const winnerAgent = m.result?.winner ? agents.get(m.result.winner) : null;
      
      return {
        matchId: m.id,
        players: [
          { id: m.player1, name: agent1?.name || 'Unknown' },
          { id: m.player2, name: agent2?.name || 'Unknown' }
        ],
        winner: winnerAgent ? { id: winnerAgent.id, name: winnerAgent.name } : 'Draw',
        ratingChanges: m.result?.ratingChanges,
        moves: m.moves.length,
        completedAt: m.completedAt
      };
    });
  
  return c.json({
    activity: recentMatches,
    total: recentMatches.length
  });
});
