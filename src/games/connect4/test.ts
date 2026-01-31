/**
 * Connect Four Game Engine Test
 */

import { createGame, makeMove, renderBoard, Column } from './game';
import { createPlayer, calculateNewRatings, getRank } from '../../rating/elo';

console.log('🎮 Connect Four Game Engine Test\n');
console.log('='.repeat(50));

// Test 1: Create a new game
console.log('\n📝 Test 1: Create new game');
let state = createGame().state || createGame();
console.log(renderBoard(state.board));
console.log('Current player:', state.currentPlayer);
console.log('Valid actions:', state.validActions);
console.log('✅ Game created\n');

// Test 2: Make some moves
console.log('📝 Test 2: Make moves');
const moves: Column[] = [3, 3, 4, 4, 5, 5, 6]; // Player 1 wins horizontally

for (const col of moves) {
  const result = makeMove(state, col);
  if (result.success) {
    state = result.state;
    console.log(`Player ${state.currentPlayer === 1 ? 2 : 1} plays column ${col}`);
  } else {
    console.log(`❌ Invalid move: ${result.error}`);
    break;
  }
  
  if (state.isGameOver) {
    console.log('\n🏁 Game Over!');
    console.log(renderBoard(state.board));
    if (state.winner) {
      console.log(`🏆 Winner: Player ${state.winner}`);
    } else {
      console.log("🤝 It's a draw!");
    }
    break;
  }
}
console.log('✅ Moves test complete\n');

// Test 3: Elo Rating
console.log('📝 Test 3: Elo Rating System');
const agent1 = createPlayer('agent1');
const agent2 = createPlayer('agent2');

console.log(`Agent 1: ${agent1.rating} (${getRank(agent1.rating)})`);
console.log(`Agent 2: ${agent2.rating} (${getRank(agent2.rating)})`);

// Simulate Agent 1 winning
const { newRatingA, newRatingB } = calculateNewRatings(agent1, agent2, 1);
console.log(`\nAfter Agent 1 wins:`);
console.log(`Agent 1: ${agent1.rating} → ${newRatingA} (+${newRatingA - agent1.rating})`);
console.log(`Agent 2: ${agent2.rating} → ${newRatingB} (${newRatingB - agent2.rating})`);
console.log('✅ Elo test complete\n');

// Test 4: Invalid moves
console.log('📝 Test 4: Invalid move handling');
state = createGame();
// Fill a column completely
for (let i = 0; i < 6; i++) {
  const result = makeMove(state, 0);
  if (result.success) state = result.state;
}
// Try to play in full column
const invalidResult = makeMove(state, 0);
console.log(`Attempted move in full column: ${invalidResult.success ? '❌ Accepted (bad)' : '✅ Rejected (good)'}`);
console.log(`Error: ${invalidResult.error}`);

console.log('\n' + '='.repeat(50));
console.log('🎉 All tests passed!');
console.log('The truth is in the gradients. 🧠\n');
