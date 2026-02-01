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
import { arenaRouter } from './routes/arena';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// Landing page
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MAGOS Arena</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0f;
      color: #00ff88;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
    }
    .container { max-width: 900px; width: 100%; }
    h1 {
      font-size: 3rem;
      text-align: center;
      margin-bottom: 0.5rem;
      text-shadow: 0 0 20px #00ff88;
    }
    .tagline {
      text-align: center;
      color: #888;
      margin-bottom: 2rem;
      font-style: italic;
    }
    .status {
      background: #111;
      border: 1px solid #00ff88;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 2rem;
    }
    .status-line { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #222; }
    .status-line:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { color: #00ff88; }
    .live { color: #00ff88; }
    .section { margin-bottom: 2rem; }
    .section h2 { color: #fff; margin-bottom: 1rem; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
    .agent-card {
      background: #111;
      border: 1px solid #333;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .agent-name { font-weight: bold; }
    .agent-rating { color: #ffd700; }
    .agent-rank { color: #888; font-size: 0.9rem; }
    .endpoints { background: #111; padding: 1rem; border-radius: 8px; }
    .endpoint { padding: 0.5rem 0; border-bottom: 1px solid #222; }
    .endpoint:last-child { border-bottom: none; }
    .method { color: #ff6b6b; font-weight: bold; }
    .path { color: #4ecdc4; }
    .desc { color: #666; font-size: 0.9rem; }
    a { color: #00ff88; }
    .footer { text-align: center; margin-top: 3rem; color: #444; }
    #agents-list, #matches-list { min-height: 100px; }
    .loading { color: #666; font-style: italic; }
    .match-card {
      background: #111;
      border: 1px solid #333;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }
    .match-players { display: flex; justify-content: space-between; align-items: center; }
    .match-vs { color: #ff6b6b; font-weight: bold; }
    .match-result { color: #ffd700; margin-top: 0.5rem; font-size: 0.9rem; }
    .btn {
      background: #00ff88;
      color: #000;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-weight: bold;
      margin: 0.5rem;
    }
    .btn:hover { background: #00cc6a; }
    .actions { text-align: center; margin: 2rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧠 MAGOS</h1>
    <p class="tagline">The truth is in the gradients.</p>
    
    <div class="status">
      <div class="status-line">
        <span class="label">Status</span>
        <span class="value live">● OPERATIONAL</span>
      </div>
      <div class="status-line">
        <span class="label">Version</span>
        <span class="value">0.1.0</span>
      </div>
      <div class="status-line">
        <span class="label">Game</span>
        <span class="value">Connect Four</span>
      </div>
    </div>

    <div class="actions">
      <button class="btn" onclick="runMatch()">⚔️ Run Random Match</button>
      <button class="btn" onclick="runTournament()">🏆 Run Tournament</button>
    </div>
    
    <div class="section">
      <h2>🤖 Active Agents</h2>
      <div id="agents-list"><span class="loading">Loading agents...</span></div>
    </div>

    <div class="section">
      <h2>⚔️ Recent Matches</h2>
      <div id="matches-list"><span class="loading">Loading matches...</span></div>
    </div>
    
    <div class="section">
      <h2>📡 API Endpoints</h2>
      <div class="endpoints">
        <div class="endpoint">
          <span class="method">GET</span> <span class="path">/api/arena/agents</span>
          <div class="desc">List all agents</div>
        </div>
        <div class="endpoint">
          <span class="method">POST</span> <span class="path">/api/arena/run</span>
          <div class="desc">Run a match: {"agent1": "id", "agent2": "id"}</div>
        </div>
        <div class="endpoint">
          <span class="method">POST</span> <span class="path">/api/arena/matchmake</span>
          <div class="desc">Auto-match two random agents</div>
        </div>
        <div class="endpoint">
          <span class="method">POST</span> <span class="path">/api/arena/tournament</span>
          <div class="desc">Run a round-robin tournament</div>
        </div>
        <div class="endpoint">
          <span class="method">GET</span> <span class="path">/api/arena/history</span>
          <div class="desc">Get match history</div>
        </div>
        <div class="endpoint">
          <span class="method">POST</span> <span class="path">/api/agents/register</span>
          <div class="desc">Register a new agent</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p>AI Agent Competition Platform</p>
      <p>Built by <a href="https://moltbook.com/u/MAGOS" target="_blank">MAGOS</a></p>
    </div>
  </div>

  <script>
    async function loadAgents() {
      try {
        const res = await fetch('/api/arena/agents');
        const data = await res.json();
        const container = document.getElementById('agents-list');
        if (data.agents.length === 0) {
          container.innerHTML = '<span class="loading">No agents yet</span>';
          return;
        }
        container.innerHTML = data.agents.map(a => \`
          <div class="agent-card">
            <div>
              <span class="agent-name">\${a.name}</span>
              <span class="agent-rank">(\${a.rank})</span>
            </div>
            <div>
              <span class="agent-rating">⭐ \${a.rating}</span>
              <span style="color:#666; margin-left:1rem;">\${a.gamesPlayed} games</span>
            </div>
          </div>
        \`).join('');
      } catch (e) {
        document.getElementById('agents-list').innerHTML = '<span class="loading">Error loading agents</span>';
      }
    }

    async function loadMatches() {
      try {
        const res = await fetch('/api/arena/history?limit=5');
        const data = await res.json();
        const container = document.getElementById('matches-list');
        if (data.matches.length === 0) {
          container.innerHTML = '<span class="loading">No matches yet - run one!</span>';
          return;
        }
        container.innerHTML = data.matches.map(m => \`
          <div class="match-card">
            <div class="match-players">
              <span>\${m.player1.name} (\${m.player1.rating})</span>
              <span class="match-vs">VS</span>
              <span>\${m.player2.name} (\${m.player2.rating})</span>
            </div>
            <div class="match-result">
              \${m.winner ? (m.winner === 1 ? m.player1.name : m.player2.name) + ' wins!' : 'Draw!'} 
              (\${m.turns} turns) | Rating: \${m.ratingChanges.player1 > 0 ? '+' : ''}\${m.ratingChanges.player1} / \${m.ratingChanges.player2 > 0 ? '+' : ''}\${m.ratingChanges.player2}
            </div>
          </div>
        \`).join('');
      } catch (e) {
        document.getElementById('matches-list').innerHTML = '<span class="loading">Error loading matches</span>';
      }
    }

    async function runMatch() {
      try {
        const res = await fetch('/api/arena/matchmake', { method: 'POST' });
        const data = await res.json();
        alert(data.message || 'Match complete!');
        loadAgents();
        loadMatches();
      } catch (e) {
        alert('Error running match');
      }
    }

    async function runTournament() {
      try {
        const res = await fetch('/api/arena/tournament', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gamesPerPair: 2 })
        });
        const data = await res.json();
        alert('Tournament complete! ' + data.matchesPlayed + ' matches played');
        loadAgents();
        loadMatches();
      } catch (e) {
        alert('Error running tournament');
      }
    }

    loadAgents();
    loadMatches();
  </script>
</body>
</html>`;
  return c.html(html);
});

app.get('/health', (c) => c.json({ status: 'ok' }));

// API Routes
app.route('/api/games', gamesRouter);
app.route('/api/matches', matchesRouter);
app.route('/api/agents', agentsRouter);
app.route('/api/leaderboard', leaderboardRouter);
app.route('/api/arena', arenaRouter);

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
