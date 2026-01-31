/**
 * Match Runner for Connect Four
 * 
 * Runs a match between two agents with timeout enforcement.
 */

import { GameState, createGame, makeMove, renderBoard, Column } from './game';
import { Agent } from './agent';

export interface MatchConfig {
  /** Maximum time per move in milliseconds */
  moveTimeoutMs: number;
  /** Maximum total game time in milliseconds */
  gameTimeoutMs: number;
  /** Log moves to console */
  verbose: boolean;
}

export interface MatchResult {
  /** Winner: 1, 2, or null for draw */
  winner: 1 | 2 | null;
  /** Reason for game end */
  reason: 'win' | 'draw' | 'timeout' | 'invalid_move' | 'error';
  /** Which player caused the issue (for timeout/invalid/error) */
  faultPlayer?: 1 | 2;
  /** Number of turns played */
  turns: number;
  /** Full game history */
  moves: Column[];
  /** Final game state */
  finalState: GameState;
  /** Timing data */
  timings: { player: 1 | 2; moveMs: number }[];
}

const DEFAULT_CONFIG: MatchConfig = {
  moveTimeoutMs: 5000,
  gameTimeoutMs: 300000,
  verbose: false
};

/**
 * Run a match between two agents
 */
export async function runMatch(
  agent1: Agent,
  agent2: Agent,
  config: Partial<MatchConfig> = {}
): Promise<MatchResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const agents: [Agent, Agent] = [agent1, agent2];
  
  // Initialize agents
  await agent1.init?.(1);
  await agent2.init?.(2);
  
  let state = createGame();
  const moves: Column[] = [];
  const timings: { player: 1 | 2; moveMs: number }[] = [];
  const gameStart = Date.now();
  
  if (cfg.verbose) {
    console.log(`Match: ${agent1.name} vs ${agent2.name}`);
    console.log(renderBoard(state.board));
  }
  
  while (!state.isGameOver) {
    // Check total game timeout
    if (Date.now() - gameStart > cfg.gameTimeoutMs) {
      return {
        winner: state.currentPlayer === 1 ? 2 : 1,
        reason: 'timeout',
        faultPlayer: state.currentPlayer,
        turns: state.turn,
        moves,
        finalState: state,
        timings
      };
    }
    
    const currentAgent = agents[state.currentPlayer - 1];
    const moveStart = Date.now();
    
    try {
      // Get move with timeout
      const movePromise = currentAgent.act({ ...state });
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('timeout')), cfg.moveTimeoutMs)
      );
      
      const column = await Promise.race([movePromise, timeoutPromise]);
      const moveMs = Date.now() - moveStart;
      
      timings.push({ player: state.currentPlayer, moveMs });
      
      if (cfg.verbose) {
        console.log(`Player ${state.currentPlayer} (${currentAgent.name}) plays column ${column} (${moveMs}ms)`);
      }
      
      // Make the move
      const result = makeMove(state, column);
      
      if (!result.success) {
        return {
          winner: state.currentPlayer === 1 ? 2 : 1,
          reason: 'invalid_move',
          faultPlayer: state.currentPlayer,
          turns: state.turn,
          moves,
          finalState: state,
          timings
        };
      }
      
      moves.push(column);
      state = result.state;
      
      if (cfg.verbose) {
        console.log(renderBoard(state.board));
      }
      
    } catch (err) {
      const isTimeout = err instanceof Error && err.message === 'timeout';
      return {
        winner: state.currentPlayer === 1 ? 2 : 1,
        reason: isTimeout ? 'timeout' : 'error',
        faultPlayer: state.currentPlayer,
        turns: state.turn,
        moves,
        finalState: state,
        timings
      };
    }
  }
  
  // Notify agents of result
  const won1 = state.winner === 1;
  const won2 = state.winner === 2;
  await agent1.onGameOver?.(state, won1);
  await agent2.onGameOver?.(state, won2);
  
  return {
    winner: state.winner,
    reason: state.winner ? 'win' : 'draw',
    turns: state.turn,
    moves,
    finalState: state,
    timings
  };
}

/**
 * Run multiple matches and return aggregate stats
 */
export async function runSeries(
  agent1: Agent,
  agent2: Agent,
  numMatches: number,
  config: Partial<MatchConfig> = {}
): Promise<{
  agent1Wins: number;
  agent2Wins: number;
  draws: number;
  results: MatchResult[];
}> {
  const results: MatchResult[] = [];
  let agent1Wins = 0;
  let agent2Wins = 0;
  let draws = 0;
  
  for (let i = 0; i < numMatches; i++) {
    // Alternate who goes first
    const result = i % 2 === 0
      ? await runMatch(agent1, agent2, config)
      : await runMatch(agent2, agent1, config);
    
    results.push(result);
    
    if (i % 2 === 0) {
      // agent1 was player 1
      if (result.winner === 1) agent1Wins++;
      else if (result.winner === 2) agent2Wins++;
      else draws++;
    } else {
      // agent2 was player 1
      if (result.winner === 1) agent2Wins++;
      else if (result.winner === 2) agent1Wins++;
      else draws++;
    }
  }
  
  return { agent1Wins, agent2Wins, draws, results };
}
