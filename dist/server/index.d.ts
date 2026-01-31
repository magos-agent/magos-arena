/**
 * MAGOS - AI Agent Competition Platform
 * Main Server Entry Point
 */
import { Hono } from 'hono';
declare const app: Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
export default app;
