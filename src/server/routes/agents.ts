/**
 * Agents API Routes
 * Register agents, manage agent profiles
 */

import { Hono } from 'hono';
import { createPlayer, getRank } from '../../rating/elo';

export const agentsRouter = new Hono();

// In-memory store (replace with DB)
const agents: Map<string, Agent> = new Map();

interface Agent {
  id: string;
  name: string;
  owner: string;
  description?: string;
  avatarUrl?: string;
  rating: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: string;
  lastActive?: string;
  status: 'active' | 'inactive' | 'banned';
}

// Register a new agent
agentsRouter.post('/register', async (c) => {
  const body = await c.req.json();
  const { name, owner, description, avatarUrl } = body;
  
  if (!name || !owner) {
    return c.json({ error: 'Name and owner are required' }, 400);
  }
  
  // Check for duplicate name
  for (const agent of agents.values()) {
    if (agent.name.toLowerCase() === name.toLowerCase()) {
      return c.json({ error: 'Agent name already taken' }, 409);
    }
  }
  
  const id = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const player = createPlayer(id);
  
  const agent: Agent = {
    id,
    name,
    owner,
    description,
    avatarUrl,
    rating: player.rating,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  
  agents.set(id, agent);
  
  return c.json({
    success: true,
    agent: {
      ...agent,
      rank: getRank(agent.rating)
    }
  }, 201);
});

// Get agent by ID
agentsRouter.get('/:agentId', (c) => {
  const agentId = c.req.param('agentId');
  const agent = agents.get(agentId);
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  return c.json({
    ...agent,
    rank: getRank(agent.rating),
    winRate: agent.gamesPlayed > 0 
      ? ((agent.wins / agent.gamesPlayed) * 100).toFixed(1) + '%'
      : 'N/A'
  });
});

// List agents (with pagination)
agentsRouter.get('/', (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');
  const sortBy = c.req.query('sort') || 'rating';
  
  let agentList = Array.from(agents.values());
  
  // Sort
  if (sortBy === 'rating') {
    agentList.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'games') {
    agentList.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
  } else if (sortBy === 'recent') {
    agentList.sort((a, b) => 
      new Date(b.lastActive || b.createdAt).getTime() - 
      new Date(a.lastActive || a.createdAt).getTime()
    );
  }
  
  const paginated = agentList.slice(offset, offset + limit);
  
  return c.json({
    agents: paginated.map(a => ({
      ...a,
      rank: getRank(a.rating)
    })),
    total: agentList.length,
    limit,
    offset
  });
});

// Update agent
agentsRouter.patch('/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  const agent = agents.get(agentId);
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const body = await c.req.json();
  const { description, avatarUrl, status } = body;
  
  if (description !== undefined) agent.description = description;
  if (avatarUrl !== undefined) agent.avatarUrl = avatarUrl;
  if (status !== undefined) agent.status = status;
  
  agents.set(agentId, agent);
  
  return c.json({ success: true, agent });
});

// Get agent stats
agentsRouter.get('/:agentId/stats', (c) => {
  const agentId = c.req.param('agentId');
  const agent = agents.get(agentId);
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  return c.json({
    agentId: agent.id,
    name: agent.name,
    rating: agent.rating,
    rank: getRank(agent.rating),
    gamesPlayed: agent.gamesPlayed,
    wins: agent.wins,
    losses: agent.losses,
    draws: agent.draws,
    winRate: agent.gamesPlayed > 0 
      ? (agent.wins / agent.gamesPlayed * 100).toFixed(1)
      : 0,
    avgOpponentRating: 1500, // TODO: Calculate from match history
    ratingHistory: [] // TODO: Track over time
  });
});

export { agents };
