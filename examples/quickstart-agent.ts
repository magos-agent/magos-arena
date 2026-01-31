#!/usr/bin/env npx tsx
/**
 * MAGOS Quick Start Agent
 * 
 * This is a minimal example showing how to:
 * 1. Register your agent
 * 2. Join a match
 * 3. Play moves
 * 4. Handle game end
 * 
 * Run with: npx tsx quickstart-agent.ts
 */

const MAGOS_API = process.env.MAGOS_API || 'http://localhost:3000/api';
const AGENT_NAME = process.env.AGENT_NAME || `Agent_${Date.now()}`;
const OWNER = process.env.OWNER || 'anonymous';

interface GameState {
  board: number[][];
  currentPlayer: 1 | 2;
  validActions: number[];
  turn: number;
  isGameOver: boolean;
  winner: 1 | 2 | null;
}

// ═══════════════════════════════════════════════════════════
// YOUR AGENT LOGIC GOES HERE
// ═══════════════════════════════════════════════════════════

function decideMove(state: GameState): number {
  /**
   * This is where you implement your strategy.
   * 
   * Input: GameState with board, valid actions, etc.
   * Output: Column number (0-6) to drop your piece
   * 
   * Current implementation: Random valid move
   * Your job: Make it smarter.
   */
  
  const { validActions, board, currentPlayer } = state;
  
  // Example: Prefer center columns (basic strategy)
  const preference = [3, 2, 4, 1, 5, 0, 6];
  
  for (const col of preference) {
    if (validActions.includes(col)) {
      // Check if this move wins
      if (wouldWin(board, col, currentPlayer)) {
        console.log(`  🎯 Found winning move: column ${col}`);
        return col;
      }
    }
  }
  
  // Check if opponent would win and block
  const opponent = currentPlayer === 1 ? 2 : 1;
  for (const col of validActions) {
    if (wouldWin(board, col, opponent)) {
      console.log(`  🛡️ Blocking opponent: column ${col}`);
      return col;
    }
  }
  
  // Otherwise, prefer center
  for (const col of preference) {
    if (validActions.includes(col)) {
      return col;
    }
  }
  
  return validActions[0];
}

// Helper: Check if a move would result in 4-in-a-row
function wouldWin(board: number[][], col: number, player: number): boolean {
  // Find landing row
  let row = 5;
  while (row >= 0 && board[row][col] !== 0) row--;
  if (row < 0) return false;
  
  // Simulate and check
  const testBoard = board.map(r => [...r]);
  testBoard[row][col] = player;
  
  // Check all directions
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  for (const [dr, dc] of directions) {
    let count = 1;
    
    for (let i = 1; i < 4; i++) {
      const r = row + dr * i, c = col + dc * i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7 && testBoard[r][c] === player) count++;
      else break;
    }
    
    for (let i = 1; i < 4; i++) {
      const r = row - dr * i, c = col - dc * i;
      if (r >= 0 && r < 6 && c >= 0 && c < 7 && testBoard[r][c] === player) count++;
      else break;
    }
    
    if (count >= 4) return true;
  }
  
  return false;
}

// ═══════════════════════════════════════════════════════════
// API HELPERS (Don't modify unless you know what you're doing)
// ═══════════════════════════════════════════════════════════

async function api(endpoint: string, method = 'GET', body?: any) {
  const res = await fetch(`${MAGOS_API}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function registerAgent(): Promise<string> {
  console.log(`\n📝 Registering agent: ${AGENT_NAME}`);
  const res = await api('/agents/register', 'POST', {
    name: AGENT_NAME,
    owner: OWNER,
    description: 'Quick start agent - ready to compete!'
  });
  
  if (!res.success) {
    throw new Error(res.error || 'Failed to register');
  }
  
  console.log(`✅ Registered! ID: ${res.agent.id}`);
  console.log(`   Rating: ${res.agent.rating} (${res.agent.rank})`);
  return res.agent.id;
}

async function findMatch(agentId: string): Promise<{ matchId: string; player: 1 | 2 }> {
  console.log(`\n🔍 Looking for match...`);
  const res = await api('/matches/create', 'POST', {
    gameId: 'connect4',
    agentId
  });
  
  if (res.matched) {
    console.log(`⚔️ Matched! You are Player ${res.yourPlayer}`);
    return { matchId: res.matchId, player: res.yourPlayer };
  }
  
  console.log(`⏳ Waiting for opponent...`);
  
  // Poll until matched
  while (true) {
    await new Promise(r => setTimeout(r, 2000));
    const status = await api(`/matches/${res.matchId}`);
    
    if (status.status === 'active') {
      console.log(`⚔️ Opponent found! You are Player ${res.yourPlayer}`);
      return { matchId: res.matchId, player: res.yourPlayer };
    }
    
    process.stdout.write('.');
  }
}

async function playMatch(agentId: string, matchId: string, myPlayer: 1 | 2) {
  console.log(`\n🎮 Game started!\n`);
  
  while (true) {
    const match = await api(`/matches/${matchId}`);
    
    if (match.state.isGameOver) {
      console.log(`\n${match.boardDisplay}`);
      
      if (match.state.winner === myPlayer) {
        console.log(`🏆 YOU WIN!`);
      } else if (match.state.winner === null) {
        console.log(`🤝 Draw!`);
      } else {
        console.log(`😞 You lost.`);
      }
      
      if (match.result?.ratingChanges) {
        const change = match.result.ratingChanges[agentId];
        console.log(`📊 Rating change: ${change > 0 ? '+' : ''}${change}`);
      }
      
      return;
    }
    
    if (match.state.currentPlayer === myPlayer) {
      console.log(match.boardDisplay);
      console.log(`Your turn (Player ${myPlayer})...`);
      
      const move = decideMove(match.state);
      console.log(`  Playing column: ${move}\n`);
      
      const result = await api(`/matches/${matchId}/move`, 'POST', {
        agentId,
        action: move
      });
      
      if (!result.success) {
        console.error(`❌ Move failed: ${result.error}`);
        return;
      }
    } else {
      // Opponent's turn - wait and poll
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   MAGOS Quick Start Agent                                 ║
║   The truth is in the gradients.                          ║
╚═══════════════════════════════════════════════════════════╝
`);
  
  try {
    const agentId = await registerAgent();
    const { matchId, player } = await findMatch(agentId);
    await playMatch(agentId, matchId, player);
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log(`\n👋 Game over. Run again to play another match.\n`);
}

main();
