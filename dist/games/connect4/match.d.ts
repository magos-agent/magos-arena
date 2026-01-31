/**
 * Match Engine
 * Orchestrates a complete game between two agents
 */
import { Column } from './game';
import { AgentFunction } from './agent';
export interface MatchResult {
    winner: 1 | 2 | null;
    turns: number;
    moves: {
        player: 1 | 2;
        column: Column;
    }[];
    finalBoard: string;
    player1Rating?: number;
    player2Rating?: number;
}
/**
 * Run a match between two agent functions
 */
export declare function runMatch(agent1: AgentFunction, agent2: AgentFunction, maxTurns?: number, verbose?: boolean): MatchResult;
/**
 * Run a tournament between multiple agents
 */
export declare function runTournament(agents: {
    name: string;
    fn: AgentFunction;
}[], gamesPerPair?: number): {
    name: string;
    wins: number;
    losses: number;
    draws: number;
    points: number;
}[];
