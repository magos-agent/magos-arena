/**
 * Agent Interface for Connect Four
 * 
 * This defines the interface that all agents must implement.
 */

import { GameState, Column } from './game';

/**
 * Agent interface - all competing agents must implement this
 */
export interface Agent {
  /**
   * Agent name/identifier
   */
  name: string;

  /**
   * Called once at the start of a match
   * Can be used for initialization
   */
  init?(playerNumber: 1 | 2): Promise<void>;

  /**
   * Called each turn to get the agent's move
   * Must return a valid column number
   * 
   * @param state Current game state (includes validActions)
   * @returns Column to drop piece in
   */
  act(state: GameState): Promise<Column>;

  /**
   * Called when the match ends (optional)
   * Can be used for learning/logging
   */
  onGameOver?(state: GameState, won: boolean): Promise<void>;
}

/**
 * Example: Random Agent
 * Just picks a random valid column
 */
export const RandomAgent: Agent = {
  name: 'RandomBot',
  
  async act(state: GameState): Promise<Column> {
    const { validActions } = state;
    const randomIndex = Math.floor(Math.random() * validActions.length);
    return validActions[randomIndex];
  }
};

/**
 * Example: Center-Preference Agent
 * Prefers center columns (better strategy)
 */
export const CenterAgent: Agent = {
  name: 'CenterBot',
  
  async act(state: GameState): Promise<Column> {
    const { validActions } = state;
    
    // Prefer center columns
    const centerPriority = [3, 2, 4, 1, 5, 0, 6] as Column[];
    
    for (const col of centerPriority) {
      if (validActions.includes(col)) {
        return col;
      }
    }
    
    // Fallback (should never happen)
    return validActions[0];
  }
};

/**
 * Example: Blocking Agent
 * Tries to block opponent's winning moves and make its own
 */
export const BlockingAgent: Agent = {
  name: 'BlockingBot',
  
  async act(state: GameState): Promise<Column> {
    const { board, validActions, currentPlayer } = state;
    const opponent = currentPlayer === 1 ? 2 : 1;
    
    // Helper: simulate a move and check for winner
    const checkWinningMove = (col: Column, player: 1 | 2): boolean => {
      // Find row where piece would land
      let row = 5;
      while (row >= 0 && board[row][col] !== 0) row--;
      if (row < 0) return false;
      
      // Temporarily place piece
      const tempBoard = board.map(r => [...r]);
      tempBoard[row][col] = player;
      
      // Check for 4 in a row (simplified check around the placed piece)
      const directions = [
        [[0, 1], [0, -1]],   // horizontal
        [[1, 0], [-1, 0]],   // vertical
        [[1, 1], [-1, -1]], // diagonal
        [[1, -1], [-1, 1]]  // anti-diagonal
      ];
      
      for (const [dir1, dir2] of directions) {
        let count = 1;
        
        for (const [dr, dc] of [dir1, dir2]) {
          let r = row + dr;
          let c = col + dc;
          while (r >= 0 && r < 6 && c >= 0 && c < 7 && tempBoard[r][c] === player) {
            count++;
            r += dr;
            c += dc;
          }
        }
        
        if (count >= 4) return true;
      }
      
      return false;
    };
    
    // 1. Check for winning move
    for (const col of validActions) {
      if (checkWinningMove(col, currentPlayer)) {
        return col;
      }
    }
    
    // 2. Block opponent's winning move
    for (const col of validActions) {
      if (checkWinningMove(col, opponent)) {
        return col;
      }
    }
    
    // 3. Prefer center
    const centerPriority = [3, 2, 4, 1, 5, 0, 6] as Column[];
    for (const col of centerPriority) {
      if (validActions.includes(col)) {
        return col;
      }
    }
    
    return validActions[0];
  }
};
