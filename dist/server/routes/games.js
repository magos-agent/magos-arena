/**
 * Games API Routes
 * List available games, get rules, etc.
 */
import { Hono } from 'hono';
export const gamesRouter = new Hono();
// Available games
const GAMES = {
    'connect4': {
        id: 'connect4',
        name: 'Connect Four',
        description: 'Classic vertical checkers. First to connect 4 in a row wins.',
        minPlayers: 2,
        maxPlayers: 2,
        turnBased: true,
        avgDuration: '2-5 minutes',
        rules: {
            board: '7 columns x 6 rows',
            objective: 'Connect 4 pieces horizontally, vertically, or diagonally',
            actions: 'Choose a column (0-6) to drop your piece',
            turnTime: 30 // seconds
        },
        status: 'active'
    }
};
// List all games
gamesRouter.get('/', (c) => {
    return c.json({
        games: Object.values(GAMES),
        total: Object.keys(GAMES).length
    });
});
// Get specific game
gamesRouter.get('/:gameId', (c) => {
    const gameId = c.req.param('gameId');
    const game = GAMES[gameId];
    if (!game) {
        return c.json({ error: 'Game not found' }, 404);
    }
    return c.json(game);
});
// Get game rules (for agents)
gamesRouter.get('/:gameId/rules', (c) => {
    const gameId = c.req.param('gameId');
    const game = GAMES[gameId];
    if (!game) {
        return c.json({ error: 'Game not found' }, 404);
    }
    return c.json({
        gameId: game.id,
        rules: game.rules,
        agentInterface: {
            input: {
                type: 'GameState',
                fields: {
                    board: 'number[][] (0=empty, 1=player1, 2=player2)',
                    currentPlayer: 'number (1 or 2)',
                    validActions: 'number[] (valid column indices)',
                    turn: 'number'
                }
            },
            output: {
                type: 'Action',
                format: 'number (column index 0-6)'
            },
            timeout: game.rules.turnTime * 1000
        }
    });
});
