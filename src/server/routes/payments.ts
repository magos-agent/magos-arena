/**
 * Payments API - x402 USDC staking system
 * Deposit → Stake → Fight → Winner takes pot minus rake
 */

import { Hono } from 'hono';
import { agents } from './agents';

export const paymentsRouter = new Hono();

// Platform wallet (receives rake)
const PLATFORM_WALLET = '0x15693347309100bb08354E92D9E1BB8Ea083ac2b';
const RAKE_PERCENT = 5; // 5% rake on all pots
const MIN_STAKE = 0.10; // $0.10 minimum
const MAX_STAKE = 100; // $100 maximum

// In-memory balances (replace with DB)
const balances: Map<string, number> = new Map();

// Pending deposits (for x402 verification)
const pendingDeposits: Map<string, { amount: number; expires: number }> = new Map();

// Get agent balance
paymentsRouter.get('/balance/:agentId', (c) => {
  const agentId = c.req.param('agentId');
  const agent = agents.get(agentId);
  
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const balance = balances.get(agentId) || 0;
  
  return c.json({
    agentId,
    name: agent.name,
    balance: balance.toFixed(6),
    currency: 'USDC',
    network: 'base'
  });
});

// Request deposit - returns x402 payment info
paymentsRouter.post('/deposit/request', async (c) => {
  const body = await c.req.json();
  const { agentId, amount } = body;
  
  if (!agentId || !amount) {
    return c.json({ error: 'agentId and amount required' }, 400);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount < MIN_STAKE) {
    return c.json({ error: `Minimum deposit: $${MIN_STAKE}` }, 400);
  }
  
  // Create deposit request (expires in 10 mins)
  const depositId = `dep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  pendingDeposits.set(depositId, {
    amount: depositAmount,
    expires: Date.now() + 600000
  });
  
  // Return x402-style payment requirements
  return c.json({
    depositId,
    paymentRequired: {
      amount: Math.floor(depositAmount * 1000000).toString(), // USDC has 6 decimals
      currency: 'USDC',
      network: 'base',
      recipient: PLATFORM_WALLET,
      scheme: 'exact',
      memo: `MAGOS deposit for ${agent.name} (${depositId})`
    },
    instructions: [
      `Send ${depositAmount} USDC to ${PLATFORM_WALLET} on Base`,
      `Include memo: ${depositId}`,
      `Then call POST /api/payments/deposit/confirm with the tx hash`
    ],
    expiresAt: new Date(Date.now() + 600000).toISOString()
  });
});

// Confirm deposit (manual for now - would verify on-chain in production)
paymentsRouter.post('/deposit/confirm', async (c) => {
  const body = await c.req.json();
  const { agentId, depositId, txHash } = body;
  
  if (!agentId || !depositId) {
    return c.json({ error: 'agentId and depositId required' }, 400);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const pending = pendingDeposits.get(depositId);
  if (!pending) {
    return c.json({ error: 'Deposit request not found or expired' }, 404);
  }
  
  if (Date.now() > pending.expires) {
    pendingDeposits.delete(depositId);
    return c.json({ error: 'Deposit request expired' }, 400);
  }
  
  // In production: verify txHash on Base blockchain
  // For now: trust the deposit (demo mode)
  
  const currentBalance = balances.get(agentId) || 0;
  balances.set(agentId, currentBalance + pending.amount);
  pendingDeposits.delete(depositId);
  
  return c.json({
    success: true,
    deposited: pending.amount,
    newBalance: (currentBalance + pending.amount).toFixed(6),
    currency: 'USDC',
    txHash: txHash || 'demo_mode'
  });
});

// Credit balance directly (for testing/admin)
paymentsRouter.post('/credit', async (c) => {
  const body = await c.req.json();
  const { agentId, amount, adminKey } = body;
  
  // Simple admin key check (replace with proper auth)
  if (adminKey !== 'magos_admin_secret') {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const creditAmount = parseFloat(amount);
  const currentBalance = balances.get(agentId) || 0;
  balances.set(agentId, currentBalance + creditAmount);
  
  return c.json({
    success: true,
    credited: creditAmount,
    newBalance: (currentBalance + creditAmount).toFixed(6)
  });
});

// Get leaderboard with balances
paymentsRouter.get('/leaderboard', (c) => {
  const agentList = Array.from(agents.values())
    .map(a => ({
      id: a.id,
      name: a.name,
      rating: a.rating,
      balance: (balances.get(a.id) || 0).toFixed(6),
      gamesPlayed: a.gamesPlayed,
      wins: a.wins
    }))
    .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));
  
  return c.json({ leaderboard: agentList });
});

// Platform stats
paymentsRouter.get('/stats', (c) => {
  const totalDeposited = Array.from(balances.values()).reduce((a, b) => a + b, 0);
  
  return c.json({
    platformWallet: PLATFORM_WALLET,
    rakePercent: RAKE_PERCENT,
    minStake: MIN_STAKE,
    maxStake: MAX_STAKE,
    totalDeposited: totalDeposited.toFixed(6),
    currency: 'USDC',
    network: 'base'
  });
});

// Export for use in staked matches
export { balances, RAKE_PERCENT, MIN_STAKE, MAX_STAKE, PLATFORM_WALLET };
