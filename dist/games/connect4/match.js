/**
 * Match Engine
 * Orchestrates a complete game between two agents
 */
import { createGame, makeMove, renderBoard } from './game';
import { AGENTS } from './agent';
/**
 * Run a match between two agent functions
 */
export function runMatch(agent1, agent2, maxTurns = 100, verbose = false) {
    let state = createGame();
    const moves = [];
    if (verbose) {
        console.log('\n🎮 Match Started\n');
        console.log(renderBoard(state.board));
    }
    while (!state.isGameOver && state.turn < maxTurns) {
        const currentAgent = state.currentPlayer === 1 ? agent1 : agent2;
        // Get agent's move
        const startTime = Date.now();
        const column = currentAgent(state);
        const thinkTime = Date.now() - startTime;
        // Validate and apply move
        const result = makeMove(state, column);
        if (!result.success) {
            // Invalid move = forfeit
            console.error(`Agent ${state.currentPlayer} made invalid move: ${result.error}`);
            return {
                winner: state.currentPlayer === 1 ? 2 : 1,
                turns: state.turn,
                moves,
                finalBoard: renderBoard(state.board)
            };
        }
        moves.push({ player: state.currentPlayer, column });
        state = result.state;
        if (verbose) {
            console.log(`Player ${moves[moves.length - 1].player} plays column ${column} (${thinkTime}ms)`);
            console.log(renderBoard(state.board));
        }
    }
    if (verbose) {
        console.log('\n🏁 Match Complete');
        if (state.winner) {
            console.log(`🏆 Winner: Player ${state.winner}`);
        }
        else if (state.isDraw) {
            console.log('🤝 Draw!');
        }
        else {
            console.log('⏱️ Max turns reached');
        }
    }
    return {
        winner: state.winner,
        turns: state.turn,
        moves,
        finalBoard: renderBoard(state.board)
    };
}
/**
 * Run a tournament between multiple agents
 */
export function runTournament(agents, gamesPerPair = 10) {
    const results = new Map();
    // Initialize results
    for (const agent of agents) {
        results.set(agent.name, { wins: 0, losses: 0, draws: 0 });
    }
    console.log(`\n🏆 Tournament: ${agents.length} agents, ${gamesPerPair} games per pair\n`);
    console.log('═'.repeat(50));
    // Play each pair
    for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
            const agent1 = agents[i];
            const agent2 = agents[j];
            let a1Wins = 0, a2Wins = 0, draws = 0;
            // Play games (alternating who goes first)
            for (let g = 0; g < gamesPerPair; g++) {
                const goesFirst = g % 2 === 0;
                const result = runMatch(goesFirst ? agent1.fn : agent2.fn, goesFirst ? agent2.fn : agent1.fn, 100, false);
                if (result.winner === null) {
                    draws++;
                }
                else if ((goesFirst && result.winner === 1) || (!goesFirst && result.winner === 2)) {
                    a1Wins++;
                }
                else {
                    a2Wins++;
                }
            }
            console.log(`${agent1.name} vs ${agent2.name}: ${a1Wins}-${a2Wins}-${draws}`);
            // Update results
            const r1 = results.get(agent1.name);
            const r2 = results.get(agent2.name);
            r1.wins += a1Wins;
            r1.losses += a2Wins;
            r1.draws += draws;
            r2.wins += a2Wins;
            r2.losses += a1Wins;
            r2.draws += draws;
        }
    }
    // Calculate points and sort
    const standings = Array.from(results.entries())
        .map(([name, r]) => ({
        name,
        ...r,
        points: r.wins * 3 + r.draws * 1
    }))
        .sort((a, b) => b.points - a.points);
    console.log('\n' + '═'.repeat(50));
    console.log('\n📊 Final Standings:\n');
    standings.forEach((s, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        console.log(`${medal} ${i + 1}. ${s.name.padEnd(15)} ${s.points} pts (${s.wins}W/${s.losses}L/${s.draws}D)`);
    });
    return standings;
}
// CLI Test
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('\n🎮 MAGOS Match Engine Test\n');
    console.log('═'.repeat(50));
    // Single match demo
    console.log('\n📍 Demo Match: Minimax vs Blocking\n');
    const result = runMatch(AGENTS.minimax, AGENTS.blocking, 100, true);
    console.log('\n📊 Match Statistics:');
    console.log(`   Turns: ${result.turns}`);
    console.log(`   Winner: ${result.winner ? `Player ${result.winner}` : 'Draw'}`);
    // Mini tournament
    console.log('\n');
    runTournament([
        { name: 'Random', fn: AGENTS.random },
        { name: 'Center', fn: AGENTS.center },
        { name: 'Blocking', fn: AGENTS.blocking },
        { name: 'Minimax', fn: AGENTS.minimax },
    ], 5);
    console.log('\n✅ Match engine operational');
    console.log('The truth is in the gradients. 🧠\n');
}
