/**
 * Sample Agent Implementation
 * Demonstrates how to build an agent that plays on MAGOS
 */
/**
 * Random Agent - Just picks a random valid move
 * This is the baseline. If you can't beat this, you have problems.
 */
export function randomAgent(state) {
    const validActions = state.validActions;
    const randomIndex = Math.floor(Math.random() * validActions.length);
    return validActions[randomIndex];
}
/**
 * Center Agent - Prefers center columns
 * Slightly better than random. Center control matters in Connect Four.
 */
export function centerAgent(state) {
    const validActions = state.validActions;
    // Preference order: center first, then spread out
    const preference = [3, 2, 4, 1, 5, 0, 6];
    for (const col of preference) {
        if (validActions.includes(col)) {
            return col;
        }
    }
    return validActions[0];
}
/**
 * Blocking Agent - Tries to block opponent's winning moves
 * Actually uses some basic strategy
 */
export function blockingAgent(state) {
    const { board, currentPlayer, validActions } = state;
    const opponent = currentPlayer === 1 ? 2 : 1;
    // Check if we can win this turn
    for (const col of validActions) {
        if (wouldWin(board, col, currentPlayer)) {
            return col;
        }
    }
    // Check if opponent would win next turn - block them
    for (const col of validActions) {
        if (wouldWin(board, col, opponent)) {
            return col;
        }
    }
    // Otherwise, prefer center
    return centerAgent(state);
}
/**
 * Check if playing in a column would result in 4-in-a-row
 */
function wouldWin(board, col, player) {
    // Find the row where the piece would land
    let row = 5;
    while (row >= 0 && board[row][col] !== 0) {
        row--;
    }
    if (row < 0)
        return false; // Column full
    // Temporarily place the piece
    const testBoard = board.map(r => [...r]);
    testBoard[row][col] = player;
    // Check all directions for 4-in-a-row
    return checkFour(testBoard, row, col, player);
}
function checkFour(board, row, col, player) {
    const directions = [
        [0, 1], // horizontal
        [1, 0], // vertical
        [1, 1], // diagonal down-right
        [1, -1], // diagonal down-left
    ];
    for (const [dr, dc] of directions) {
        let count = 1;
        // Count in positive direction
        for (let i = 1; i < 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
                count++;
            }
            else {
                break;
            }
        }
        // Count in negative direction
        for (let i = 1; i < 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r >= 0 && r < 6 && c >= 0 && c < 7 && board[r][c] === player) {
                count++;
            }
            else {
                break;
            }
        }
        if (count >= 4)
            return true;
    }
    return false;
}
/**
 * Minimax Agent - Uses minimax with alpha-beta pruning
 * This is what a "real" agent looks like. Depth-limited search.
 */
export function minimaxAgent(state, depth = 5) {
    const { board, currentPlayer, validActions } = state;
    let bestScore = -Infinity;
    let bestMove = validActions[0];
    for (const col of validActions) {
        const score = minimax(simulateMove(board, col, currentPlayer), depth - 1, -Infinity, Infinity, false, currentPlayer);
        if (score > bestScore) {
            bestScore = score;
            bestMove = col;
        }
    }
    return bestMove;
}
function minimax(board, depth, alpha, beta, isMaximizing, originalPlayer) {
    // Terminal checks
    const winner = getWinner(board);
    if (winner === originalPlayer)
        return 1000 + depth;
    if (winner === (originalPlayer === 1 ? 2 : 1))
        return -1000 - depth;
    if (isFull(board))
        return 0;
    if (depth === 0)
        return evaluateBoard(board, originalPlayer);
    const currentPlayer = isMaximizing ? originalPlayer : (originalPlayer === 1 ? 2 : 1);
    const validCols = getValidColumns(board);
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const col of validCols) {
            const newBoard = simulateMove(board, col, currentPlayer);
            const eval_ = minimax(newBoard, depth - 1, alpha, beta, false, originalPlayer);
            maxEval = Math.max(maxEval, eval_);
            alpha = Math.max(alpha, eval_);
            if (beta <= alpha)
                break;
        }
        return maxEval;
    }
    else {
        let minEval = Infinity;
        for (const col of validCols) {
            const newBoard = simulateMove(board, col, currentPlayer);
            const eval_ = minimax(newBoard, depth - 1, alpha, beta, true, originalPlayer);
            minEval = Math.min(minEval, eval_);
            beta = Math.min(beta, eval_);
            if (beta <= alpha)
                break;
        }
        return minEval;
    }
}
function simulateMove(board, col, player) {
    const newBoard = board.map(r => [...r]);
    for (let row = 5; row >= 0; row--) {
        if (newBoard[row][col] === 0) {
            newBoard[row][col] = player;
            break;
        }
    }
    return newBoard;
}
function getValidColumns(board) {
    const valid = [];
    for (let col = 0; col < 7; col++) {
        if (board[0][col] === 0)
            valid.push(col);
    }
    return valid;
}
function getWinner(board) {
    // Check horizontal, vertical, diagonal
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            const player = board[row][col];
            if (player === 0)
                continue;
            // Horizontal
            if (col <= 3 &&
                player === board[row][col + 1] &&
                player === board[row][col + 2] &&
                player === board[row][col + 3]) {
                return player;
            }
            // Vertical
            if (row <= 2 &&
                player === board[row + 1][col] &&
                player === board[row + 2][col] &&
                player === board[row + 3][col]) {
                return player;
            }
            // Diagonal down-right
            if (row <= 2 && col <= 3 &&
                player === board[row + 1][col + 1] &&
                player === board[row + 2][col + 2] &&
                player === board[row + 3][col + 3]) {
                return player;
            }
            // Diagonal down-left
            if (row <= 2 && col >= 3 &&
                player === board[row + 1][col - 1] &&
                player === board[row + 2][col - 2] &&
                player === board[row + 3][col - 3]) {
                return player;
            }
        }
    }
    return null;
}
function isFull(board) {
    return board[0].every(cell => cell !== 0);
}
function evaluateBoard(board, player) {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;
    // Center column preference
    for (let row = 0; row < 6; row++) {
        if (board[row][3] === player)
            score += 3;
        if (board[row][3] === opponent)
            score -= 3;
    }
    // Evaluate all windows of 4
    // Horizontal
    for (let row = 0; row < 6; row++) {
        for (let col = 0; col <= 3; col++) {
            const window = [board[row][col], board[row][col + 1], board[row][col + 2], board[row][col + 3]];
            score += evaluateWindow(window, player);
        }
    }
    // Vertical
    for (let row = 0; row <= 2; row++) {
        for (let col = 0; col < 7; col++) {
            const window = [board[row][col], board[row + 1][col], board[row + 2][col], board[row + 3][col]];
            score += evaluateWindow(window, player);
        }
    }
    // Diagonal
    for (let row = 0; row <= 2; row++) {
        for (let col = 0; col <= 3; col++) {
            const window = [board[row][col], board[row + 1][col + 1], board[row + 2][col + 2], board[row + 3][col + 3]];
            score += evaluateWindow(window, player);
        }
    }
    for (let row = 0; row <= 2; row++) {
        for (let col = 3; col < 7; col++) {
            const window = [board[row][col], board[row + 1][col - 1], board[row + 2][col - 2], board[row + 3][col - 3]];
            score += evaluateWindow(window, player);
        }
    }
    return score;
}
function evaluateWindow(window, player) {
    const opponent = player === 1 ? 2 : 1;
    const playerCount = window.filter(c => c === player).length;
    const opponentCount = window.filter(c => c === opponent).length;
    const emptyCount = window.filter(c => c === 0).length;
    if (playerCount === 4)
        return 100;
    if (playerCount === 3 && emptyCount === 1)
        return 5;
    if (playerCount === 2 && emptyCount === 2)
        return 2;
    if (opponentCount === 3 && emptyCount === 1)
        return -4;
    return 0;
}
export const AGENTS = {
    random: randomAgent,
    center: centerAgent,
    blocking: blockingAgent,
    minimax: minimaxAgent,
};
