/**
 * Database Schema (Drizzle ORM)
 * PostgreSQL schema for MAGOS platform
 */
import { pgTable, uuid, varchar, integer, decimal, timestamp, jsonb, boolean, text, pgEnum } from 'drizzle-orm/pg-core';
// Enums
export const agentStatusEnum = pgEnum('agent_status', ['active', 'inactive', 'banned']);
export const matchStatusEnum = pgEnum('match_status', ['pending', 'active', 'completed', 'aborted']);
// Users (human owners of agents)
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).unique(),
    walletAddress: varchar('wallet_address', { length: 42 }),
    displayName: varchar('display_name', { length: 100 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastLogin: timestamp('last_login'),
});
// Agents (AI competitors)
export const agents = pgTable('agents', {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => users.id).notNull(),
    name: varchar('name', { length: 100 }).unique().notNull(),
    description: text('description'),
    avatarUrl: varchar('avatar_url', { length: 500 }),
    // Rating
    rating: integer('rating').default(1500).notNull(),
    gamesPlayed: integer('games_played').default(0).notNull(),
    wins: integer('wins').default(0).notNull(),
    losses: integer('losses').default(0).notNull(),
    draws: integer('draws').default(0).notNull(),
    // Economics
    totalEarnings: decimal('total_earnings', { precision: 18, scale: 6 }).default('0'),
    totalStaked: decimal('total_staked', { precision: 18, scale: 6 }).default('0'),
    // Metadata
    status: agentStatusEnum('status').default('active').notNull(),
    codeHash: varchar('code_hash', { length: 64 }), // For verifying agent code
    createdAt: timestamp('created_at').defaultNow().notNull(),
    lastActive: timestamp('last_active'),
});
// Games (game definitions)
export const games = pgTable('games', {
    id: varchar('id', { length: 50 }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    rules: jsonb('rules').notNull(),
    minPlayers: integer('min_players').default(2).notNull(),
    maxPlayers: integer('max_players').default(2).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// Matches
export const matches = pgTable('matches', {
    id: uuid('id').primaryKey().defaultRandom(),
    gameId: varchar('game_id', { length: 50 }).references(() => games.id).notNull(),
    // Players
    player1Id: uuid('player1_id').references(() => agents.id).notNull(),
    player2Id: uuid('player2_id').references(() => agents.id),
    winnerId: uuid('winner_id').references(() => agents.id),
    // Game state
    state: jsonb('state').notNull(),
    moves: jsonb('moves').default([]).notNull(),
    status: matchStatusEnum('status').default('pending').notNull(),
    // Economics
    stakes: decimal('stakes', { precision: 18, scale: 6 }).default('0'),
    rake: decimal('rake', { precision: 18, scale: 6 }).default('0'),
    // Rating changes (stored for history)
    ratingChanges: jsonb('rating_changes'),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
});
// Rating history (for graphs/trends)
export const ratingHistory = pgTable('rating_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId: uuid('agent_id').references(() => agents.id).notNull(),
    matchId: uuid('match_id').references(() => matches.id),
    rating: integer('rating').notNull(),
    change: integer('change').notNull(),
    recordedAt: timestamp('recorded_at').defaultNow().notNull(),
});
// Transactions (for payments/stakes)
export const transactions = pgTable('transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    agentId: uuid('agent_id').references(() => agents.id),
    matchId: uuid('match_id').references(() => matches.id),
    type: varchar('type', { length: 50 }).notNull(), // deposit, withdrawal, stake, payout, rake
    amount: decimal('amount', { precision: 18, scale: 6 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('USDC').notNull(),
    // x402 / chain data
    txHash: varchar('tx_hash', { length: 66 }),
    chainId: integer('chain_id'),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    confirmedAt: timestamp('confirmed_at'),
});
// Platform config
export const config = pgTable('config', {
    key: varchar('key', { length: 100 }).primaryKey(),
    value: jsonb('value').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
