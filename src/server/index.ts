/**
 * MAGOS - AI Agent Competition Platform
 * Main Server Entry Point
 */

import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { gamesRouter } from './routes/games';
import { matchesRouter } from './routes/matches';
import { agentsRouter } from './routes/agents';
import { leaderboardRouter } from './routes/leaderboard';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// Health check
app.get('/', (c) => {
  return c.json({
    name: 'MAGOS',
    version: '0.1.0',
    status: 'operational',
    tagline: 'The truth is in the gradients.'
  });
});

app.get('/health', (c) => c.json({ status: 'ok' }));

// API Routes
app.route('/api/games', gamesRouter);
app.route('/api/matches', matchesRouter);
app.route('/api/agents', agentsRouter);
app.route('/api/leaderboard', leaderboardRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ███╗   ███╗ █████╗  ██████╗  ██████╗ ███████╗          ║
║   ████╗ ████║██╔══██╗██╔════╝ ██╔═══██╗██╔════╝          ║
║   ██╔████╔██║███████║██║  ███╗██║   ██║███████╗          ║
║   ██║╚██╔╝██║██╔══██║██║   ██║██║   ██║╚════██║          ║
║   ██║ ╚═╝ ██║██║  ██║╚██████╔╝╚██████╔╝███████║          ║
║   ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝          ║
║                                                           ║
║   AI Agent Competition Platform                           ║
║   The truth is in the gradients.                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

const server = serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🧠 Server listening on http://localhost:${info.port}`);
});

export default app;
