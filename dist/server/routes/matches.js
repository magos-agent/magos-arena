/**
 * Matches API Routes
 * Create matches, submit moves, get match state
 */
import { Hono } from 'hono';
import { createGame, makeMove, renderBoard } from '../../games/connect4/game';
import { calculateNewRatings, createPlayer } from '../../rating/elo';
import { agents } from './agents';
export const matchesRouter = new Hono();
// In-memory store (replace with DB)
const matches = new Map();
const pendingQueue = []; // Match IDs waiting for opponent
// Create a match (or join pending)
matchesRouter.post('/create', async (c) => {
    const body = await c.req.json();
    const { gameId, agentId, stakes } = body;
    if (!gameId || !agentId) {
        return c.json({ error: 'gameId and agentId are required' }, 400);
    }
    if (gameId !== 'connect4') {
        return c.json({ error: 'Unknown game' }, 400);
    }
    // Check if there's a pending match to join
    if (pendingQueue.length > 0) {
        const pendingMatchId = pendingQueue.shift();
        const pendingMatch = matches.get(pendingMatchId);
        // Don't match against yourself
        if (pendingMatch.player1 === agentId) {
            pendingQueue.unshift(pendingMatchId);
        }
        else {
            // Join the match
            pendingMatch.player2 = agentId;
            pendingMatch.status = 'active';
            pendingMatch.startedAt = new Date().toISOString();
            matches.set(pendingMatchId, pendingMatch);
            return c.json({
                matched: true,
                matchId: pendingMatchId,
                yourPlayer: 2,
                opponent: pendingMatch.player1,
                state: pendingMatch.state
            });
        }
    }
    // Create new pending match
    const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const state = createGame();
    const match = {
        id: matchId,
        gameId,
        player1: agentId,
        player2: '', // TBD
        state,
        moves: [],
        status: 'pending',
        stakes: stakes || 0,
        createdAt: new Date().toISOString()
    };
    matches.set(matchId, match);
    pendingQueue.push(matchId);
    return c.json({
        matched: false,
        matchId,
        yourPlayer: 1,
        message: 'Waiting for opponent...',
        state
    }, 201);
});
// Get match state
matchesRouter.get('/:matchId', (c) => {
    const matchId = c.req.param('matchId');
    const match = matches.get(matchId);
    if (!match) {
        return c.json({ error: 'Match not found' }, 404);
    }
    return c.json({
        ...match,
        boardDisplay: renderBoard(match.state.board)
    });
});
// Submit a move
matchesRouter.post('/:matchId/move', async (c) => {
    const matchId = c.req.param('matchId');
    const match = matches.get(matchId);
    if (!match) {
        return c.json({ error: 'Match not found' }, 404);
    }
    if (match.status !== 'active') {
        return c.json({ error: `Match is ${match.status}` }, 400);
    }
    const body = await c.req.json();
    const { agentId, action } = body;
    // Verify it's this agent's turn
    const expectedPlayer = match.state.currentPlayer;
    const expectedAgentId = expectedPlayer === 1 ? match.player1 : match.player2;
    if (agentId !== expectedAgentId) {
        return c.json({ error: 'Not your turn' }, 403);
    }
    // Validate and make move
    const result = makeMove(match.state, action);
    if (!result.success) {
        return c.json({ error: result.error }, 400);
    }
    // Update match
    match.state = result.state;
    match.moves.push({
        player: expectedPlayer,
        action,
        timestamp: new Date().toISOString()
    });
    // Check if game is over
    if (result.state.isGameOver) {
        match.status = 'completed';
        match.completedAt = new Date().toISOString();
        // Determine winner
        let winnerId = null;
        if (result.state.winner === 1)
            winnerId = match.player1;
        else if (result.state.winner === 2)
            winnerId = match.player2;
        // Calculate rating changes
        const agent1 = agents.get(match.player1);
        const agent2 = agents.get(match.player2);
        if (agent1 && agent2) {
            const player1 = createPlayer(agent1.id);
            player1.rating = agent1.rating;
            player1.gamesPlayed = agent1.gamesPlayed;
            const player2 = createPlayer(agent2.id);
            player2.rating = agent2.rating;
            player2.gamesPlayed = agent2.gamesPlayed;
            const gameResult = result.state.winner === 1 ? 1 :
                result.state.winner === 2 ? 0 : 0.5;
            const { newRatingA, newRatingB } = calculateNewRatings(player1, player2, gameResult);
            match.result = {
                winner: winnerId,
                ratingChanges: {
                    [match.player1]: newRatingA - agent1.rating,
                    [match.player2]: newRatingB - agent2.rating
                }
            };
            // Update agent stats
            agent1.rating = newRatingA;
            agent1.gamesPlayed++;
            agent2.rating = newRatingB;
            agent2.gamesPlayed++;
            if (winnerId === match.player1) {
                agent1.wins++;
                agent2.losses++;
            }
            else if (winnerId === match.player2) {
                agent2.wins++;
                agent1.losses++;
            }
            else {
                agent1.draws++;
                agent2.draws++;
            }
            agent1.lastActive = new Date().toISOString();
            agent2.lastActive = new Date().toISOString();
            agents.set(match.player1, agent1);
            agents.set(match.player2, agent2);
        }
    }
    matches.set(matchId, match);
    return c.json({
        success: true,
        state: match.state,
        boardDisplay: renderBoard(match.state.board),
        gameOver: match.state.isGameOver,
        result: match.result
    });
});
// List matches (with filters)
matchesRouter.get('/', (c) => {
    const status = c.req.query('status');
    const agentId = c.req.query('agent');
    const limit = parseInt(c.req.query('limit') || '20');
    let matchList = Array.from(matches.values());
    if (status) {
        matchList = matchList.filter(m => m.status === status);
    }
    if (agentId) {
        matchList = matchList.filter(m => m.player1 === agentId || m.player2 === agentId);
    }
    // Sort by most recent first
    matchList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({
        matches: matchList.slice(0, limit),
        total: matchList.length
    });
});
export { matches };
