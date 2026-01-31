/**
 * Connect Four Game Engine
 * 
 * A simple but non-trivial game for the MVP.
 * Rules: 7 columns, 6 rows. First to connect 4 in a row/column/diagonal wins.
 */

export const COLS = 7;
export const ROWS = 6;

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
export function createBoard(): Board {
  return Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

/**
 * Get valid columns (not full)
 */
export function getValidActions(board: Board): Column[] {
  const valid: Column[] = [];
  for (let col = 0; col < COLS; col++) {
    if (board[0][col] === 0) {
      valid.push(col as Column);
    }
  }
  return valid;
}

/**
 * Check if a player has won
 */
export function checkWinner(board: Board): Player | null {
  // Check horizontal
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const cell = board[row][col];
      if (cell !== 0 &&
          cell === board[row][col + 1] &&
          cell === board[row][col + 2] &&
          cell === board[row][col + 3]) {
        return cell;
      }
    }
  }

  // Check vertical
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col < COLS; col++) {
      const cell = board[row][col];
      if (cell !== 0 &&
          cell === board[row + 1][col] &&
          cell === board[row + 2][col] &&
          cell === board[row + 3][col]) {
        return cell;
      }
    }
  }

  // Check diagonal (down-right)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 0; col <= COLS - 4; col++) {
      const cell = board[row][col];
      if (cell !== 0 &&
          cell === board[row + 1][col + 1] &&
          cell === board[row + 2][col + 2] &&
          cell === board[row + 3][col + 3]) {
        return cell;
      }
    }
  }

  // Check diagonal (down-left)
  for (let row = 0; row <= ROWS - 4; row++) {
    for (let col = 3; col < COLS; col++) {
      const cell = board[row][col];
      if (cell !== 0 &&
          cell === board[row + 1][col - 1] &&
          cell === board[row + 2][col - 2] &&
          cell === board[row + 3][col - 3]) {
        return cell;
      }
    }
  }

  return null;
}

/**
 * Check if the board is full (draw)
 */
export function isDraw(board: Board): boolean {
  return board[0].every(cell => cell !== 0);
}

/**
 * Create initial game state
 */
export function createGame(): GameState {
  const board = createBoard();
  return {
    board,
    currentPlayer: 1,
    turn: 0,
    validActions: getValidActions(board),
    winner: null,
    isDraw: false,
    isGameOver: false
  };
}

/**
 * Make a move
 */
export function makeMove(state: GameState, column: Column): MoveResult {
  // Validate game is not over
  if (state.isGameOver) {
    return { success: false, error: 'Game is already over', state };
  }

  // Validate column is valid
  if (!state.validActions.includes(column)) {
    return { success: false, error: `Column ${column} is not valid`, state };
  }

  // Clone board
  const newBoard = state.board.map(row => [...row]);

  // Find lowest empty row in column
  let row = ROWS - 1;
  while (row >= 0 && newBoard[row][column] !== 0) {
    row--;
  }

  // Place piece
  newBoard[row][column] = state.currentPlayer;

  // Check for winner
  const winner = checkWinner(newBoard);
  const draw = !winner && isDraw(newBoard);
  const isGameOver = winner !== null || draw;

  // Create new state
  const newState: GameState = {
    board: newBoard,
    currentPlayer: state.currentPlayer === 1 ? 2 : 1,
    turn: state.turn + 1,
    validActions: isGameOver ? [] : getValidActions(newBoard),
    winner,
    isDraw: draw,
    isGameOver
  };

  return { success: true, state: newState };
}

/**
 * Render board as string (for debugging)
 */
export function renderBoard(board: Board): string {
  const symbols = ['.', 'X', 'O'];
  let output = '';
  
  for (let row = 0; row < ROWS; row++) {
    output += '|';
    for (let col = 0; col < COLS; col++) {
      output += symbols[board[row][col]] + '|';
    }
    output += '\n';
  }
  output += ' 0 1 2 3 4 5 6\n';
  
  return output;
}
