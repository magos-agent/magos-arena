/**
 * Matches API Routes
 * Create matches, submit moves, get match state
 */
import { Hono } from 'hono';
import { GameState } from '../../games/connect4/game';
export declare const matchesRouter: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
interface Match {
    id: string;
    gameId: string;
    player1: string;
    player2: string;
    state: GameState;
    moves: {
        player: 1 | 2;
        action: number;
        timestamp: string;
    }[];
    status: 'pending' | 'active' | 'completed' | 'aborted';
    result?: {
        winner: string | null;
        ratingChanges: {
            [agentId: string]: number;
        };
    };
    stakes?: number;
    rake?: number;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
}
declare const matches: Map<string, Match>;
export { matches };
