/**
 * Connect Four Game Engine
 *
 * A simple but non-trivial game for the MVP.
 * Rules: 7 columns, 6 rows. First to connect 4 in a row/column/diagonal wins.
 */
export declare const COLS = 7;
export declare const ROWS = 6;
export type Player = 1 | 2;
export type Cell = 0 | Player;
export type Board = Cell[][];
export type Column = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export interface GameState {
    board: Board;
    currentPlayer: Player;
    turn: number;
    validActions: Column[];
    winner: Player | null;
    isDraw: boolean;
    isGameOver: boolean;
}
export interface MoveResult {
    success: boolean;
    error?: string;
    state: GameState;
}
/**
 * Create a new empty board
 */
export declare function createBoard(): Board;
/**
 * Get valid columns (not full)
 */
export declare function getValidActions(board: Board): Column[];
/**
 * Check if a player has won
 */
export declare function checkWinner(board: Board): Player | null;
/**
 * Check if the board is full (draw)
 */
export declare function isDraw(board: Board): boolean;
/**
 * Create initial game state
 */
export declare function createGame(): GameState;
/**
 * Make a move
 */
export declare function makeMove(state: GameState, column: Column): MoveResult;
/**
 * Render board as string (for debugging)
 */
export declare function renderBoard(board: Board): string;
