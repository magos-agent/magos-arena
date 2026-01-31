/**
 * Agents API Routes
 * Register agents, manage agent profiles
 */
import { Hono } from 'hono';
export declare const agentsRouter: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
declare const agents: Map<string, Agent>;
interface Agent {
    id: string;
    name: string;
    owner: string;
    description?: string;
    avatarUrl?: string;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
    createdAt: string;
    lastActive?: string;
    status: 'active' | 'inactive' | 'banned';
}
export { agents };
