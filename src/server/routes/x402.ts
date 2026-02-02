/**
 * x402 Payment Protocol Support
 * HTTP 402 Payment Required with automatic payment negotiation
 */

import { Hono } from 'hono';
import { balances, PLATFORM_WALLET, MIN_STAKE, MAX_STAKE } from './payments';
import { agents } from './agents';

export const x402Router = new Hono();

// x402 payment scheme version
const X402_VERSION = '1';

/**
 * Generate x402 payment required response
 */
export function generate402Response(
  agentId: string,
  amount: number,
  resource: string,
  description: string
) {
  const paymentId = `x402_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  // Store pending payment (expires in 5 minutes)
  pendingX402Payments.set(paymentId, {
    agentId,
    amount,
    resource,
    createdAt: Date.now(),
    expiresAt: Date.now() + 300000
  });
  
  return {
    status: 402,
    headers: {
      'X-Payment-Required': 'true',
      'X-Payment-Version': X402_VERSION,
      'X-Payment-Id': paymentId,
      'X-Payment-Amount': Math.floor(amount * 1000000).toString(), // USDC 6 decimals
      'X-Payment-Currency': 'USDC',
      'X-Payment-Network': 'base',
      'X-Payment-Recipient': PLATFORM_WALLET,
      'X-Payment-Description': description
    },
    body: {
      error: 'Payment Required',
      code: 'PAYMENT_REQUIRED',
      payment: {
        id: paymentId,
        amount: amount.toFixed(6),
        amountRaw: Math.floor(amount * 1000000).toString(),
        currency: 'USDC',
        network: 'base',
        chainId: 8453,
        recipient: PLATFORM_WALLET,
        description,
        resource,
        expiresAt: new Date(Date.now() + 300000).toISOString(),
        // x402 standard payment info
        x402: {
          version: X402_VERSION,
          payTo: PLATFORM_WALLET,
          maxAmountRequired: Math.floor(amount * 1000000).toString(),
          asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
          chainId: 8453
        }
      },
      instructions: [
        `Send ${amount} USDC to ${PLATFORM_WALLET} on Base`,
        `Include payment ID in transaction data or call /api/x402/confirm`,
        `Or use an x402-compatible client for automatic payment`
      ]
    }
  };
}

// Pending x402 payments awaiting confirmation
const pendingX402Payments: Map<string, {
  agentId: string;
  amount: number;
  resource: string;
  createdAt: number;
  expiresAt: number;
}> = new Map();

// Confirmed x402 payments (for replay protection)
const confirmedX402Payments: Set<string> = new Set();

/**
 * Verify x402 payment from request headers
 * Returns the payment if valid, null if not
 */
export function verifyX402Payment(headers: Headers): {
  paymentId: string;
  txHash: string;
  amount: number;
  agentId: string;
} | null {
  const paymentId = headers.get('X-Payment-Id');
  const txHash = headers.get('X-Payment-Tx') || headers.get('X-Payment-Hash');
  
  if (!paymentId || !txHash) return null;
  
  // Check if already used (replay protection)
  if (confirmedX402Payments.has(paymentId)) return null;
  
  const pending = pendingX402Payments.get(paymentId);
  if (!pending) return null;
  
  if (Date.now() > pending.expiresAt) {
    pendingX402Payments.delete(paymentId);
    return null;
  }
  
  // In production: verify txHash on Base blockchain
  // For demo: trust the payment
  
  return {
    paymentId,
    txHash,
    amount: pending.amount,
    agentId: pending.agentId
  };
}

/**
 * Mark x402 payment as confirmed
 */
export function confirmX402Payment(paymentId: string): boolean {
  const pending = pendingX402Payments.get(paymentId);
  if (!pending) return false;
  
  // Credit the agent's balance
  const currentBalance = balances.get(pending.agentId) || 0;
  balances.set(pending.agentId, currentBalance + pending.amount);
  
  // Mark as confirmed
  confirmedX402Payments.add(paymentId);
  pendingX402Payments.delete(paymentId);
  
  return true;
}

// Manual confirmation endpoint
x402Router.post('/confirm', async (c) => {
  const body = await c.req.json();
  const { paymentId, txHash } = body;
  
  if (!paymentId) {
    return c.json({ error: 'paymentId required' }, 400);
  }
  
  const pending = pendingX402Payments.get(paymentId);
  if (!pending) {
    return c.json({ error: 'Payment not found or expired' }, 404);
  }
  
  if (Date.now() > pending.expiresAt) {
    pendingX402Payments.delete(paymentId);
    return c.json({ error: 'Payment expired' }, 400);
  }
  
  // In production: verify txHash on-chain
  // For demo: trust it
  
  if (!confirmX402Payment(paymentId)) {
    return c.json({ error: 'Confirmation failed' }, 500);
  }
  
  const agent = agents.get(pending.agentId);
  const newBalance = balances.get(pending.agentId) || 0;
  
  return c.json({
    success: true,
    credited: pending.amount,
    balance: newBalance.toFixed(6),
    agent: agent?.name || pending.agentId,
    message: `Payment confirmed. You can now use ${pending.resource}`
  });
});

// Check payment status
x402Router.get('/status/:paymentId', (c) => {
  const paymentId = c.req.param('paymentId');
  
  if (confirmedX402Payments.has(paymentId)) {
    return c.json({ status: 'confirmed' });
  }
  
  const pending = pendingX402Payments.get(paymentId);
  if (!pending) {
    return c.json({ status: 'not_found' }, 404);
  }
  
  if (Date.now() > pending.expiresAt) {
    return c.json({ status: 'expired' });
  }
  
  return c.json({
    status: 'pending',
    amount: pending.amount,
    expiresAt: new Date(pending.expiresAt).toISOString()
  });
});

// x402 info endpoint
x402Router.get('/info', (c) => {
  return c.json({
    version: X402_VERSION,
    supported: true,
    network: 'base',
    chainId: 8453,
    currency: 'USDC',
    currencyAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    recipient: PLATFORM_WALLET,
    minPayment: MIN_STAKE,
    maxPayment: MAX_STAKE,
    endpoints: {
      confirm: '/api/x402/confirm',
      status: '/api/x402/status/:paymentId'
    }
  });
});

export { pendingX402Payments, confirmedX402Payments };
