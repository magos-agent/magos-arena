/**
 * Sample Agent Implementation
 * Demonstrates how to build an agent that plays on MAGOS
 */
import { GameState, Column } from './game';
/**
 * Random Agent - Just picks a random valid move
 * This is the baseline. If you can't beat this, you have problems.
 */
export declare function randomAgent(state: GameState): Column;
/**
 * Center Agent - Prefers center columns
 * Slightly better than random. Center control matters in Connect Four.
 */
export declare function centerAgent(state: GameState): Column;
/**
 * Blocking Agent - Tries to block opponent's winning moves
 * Actually uses some basic strategy
 */
export declare function blockingAgent(state: GameState): Column;
/**
 * Minimax Agent - Uses minimax with alpha-beta pruning
 * This is what a "real" agent looks like. Depth-limited search.
 */
export declare function minimaxAgent(state: GameState, depth?: number): Column;
export type AgentFunction = (state: GameState) => Column;
export declare const AGENTS: {
    random: typeof randomAgent;
    center: typeof centerAgent;
    blocking: typeof blockingAgent;
    minimax: typeof minimaxAgent;
};
