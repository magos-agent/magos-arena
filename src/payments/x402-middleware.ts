/**
 * x402 Payment Middleware for Agent Arena
 * 
 * Every endpoint that provides value = payment required.
 * We are the house. The house always wins.
 */

import { createPublicClient, createWalletClient, http, parseUnits, formatUnits } from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Treasury wallet - where all fees flow
const TREASURY_ADDRESS = process.env.WALLET_ADDRESS as `0x${string}`;
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY as `0x${string}`;

// USDC on Base (6 decimals)
const USDC_ADDRESS = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_DECIMALS = 6;

// Rake percentages by stake tier
const RAKE_TIERS = [
  { maxStake: 10, rake: 0.15 },    // 15% for stakes up to $10
  { maxStake: 100, rake: 0.12 },   // 12% for stakes up to $100
  { maxStake: 1000, rake: 0.10 },  // 10% for stakes up to $1000
  { maxStake: Infinity, rake: 0.08 } // 8% for high rollers
];

// Fixed prices for services (in USDC, 6 decimals)
export const PRICES = {
  MATCH_EVAL: parseUnits('0.05', USDC_DECIMALS),      // $0.05 per eval
  REPLAY_ACCESS: parseUnits('0.10', USDC_DECIMALS),   // $0.10 per replay
  ANALYTICS_REPORT: parseUnits('1.00', USDC_DECIMALS), // $1.00 per report
  PRIORITY_QUEUE: parseUnits('0.50', USDC_DECIMALS),  // $0.50 instant match
  TOURNAMENT_ENTRY_MULTIPLIER: 1.20, // 20% markup on tournament entries
};

/**
 * Calculate rake for a given stake amount
 */
export function calculateRake(stakeUSD: number): { rake: number; total: number } {
  const tier = RAKE_TIERS.find(t => stakeUSD <= t.maxStake) || RAKE_TIERS[RAKE_TIERS.length - 1];
  const rake = stakeUSD * tier.rake;
  return {
    rake,
    total: stakeUSD + rake
  };
}

/**
 * Generate 402 Payment Required response
 */
export function generate402Response(amountUSDC: bigint, description: string) {
  const paymentDetails = {
    amount: amountUSDC.toString(),
    currency: 'USDC',
    network: 'base',
    chainId: 8453,
    recipient: TREASURY_ADDRESS,
    token: USDC_ADDRESS,
    scheme: 'exact',
    description,
    expires: Date.now() + 300000, // 5 minutes
  };

  return {
    status: 402,
    headers: {
      'PAYMENT-REQUIRED': Buffer.from(JSON.stringify(paymentDetails)).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: {
      error: 'Payment Required',
      message: description,
      amount: formatUnits(amountUSDC, USDC_DECIMALS),
      currency: 'USDC',
      network: 'Base',
      recipient: TREASURY_ADDRESS,
    }
  };
}

/**
 * Verify x402 payment signature
 */
export async function verifyPayment(
  paymentSignature: string,
  expectedAmount: bigint
): Promise<{ valid: boolean; txHash?: string; error?: string }> {
  try {
    const payment = JSON.parse(Buffer.from(paymentSignature, 'base64').toString());
    
    // Verify amount matches
    if (BigInt(payment.amount) < expectedAmount) {
      return { valid: false, error: 'Insufficient payment amount' };
    }

    // Verify recipient is our treasury
    if (payment.recipient.toLowerCase() !== TREASURY_ADDRESS.toLowerCase()) {
      return { valid: false, error: 'Invalid recipient' };
    }

    // Verify not expired
    if (payment.expires && payment.expires < Date.now()) {
      return { valid: false, error: 'Payment expired' };
    }

    // TODO: Verify signature on-chain via facilitator
    // For now, trust the signature (in production, verify on-chain)

    return { valid: true, txHash: payment.txHash };
  } catch (err) {
    return { valid: false, error: 'Invalid payment signature' };
  }
}

/**
 * Express/Hono middleware for x402 payments
 */
export function x402Middleware(options: {
  amount: bigint | ((req: any) => bigint);
  description: string | ((req: any) => string);
}) {
  return async (req: any, res: any, next: any) => {
    const paymentSig = req.headers['payment-signature'];

    if (!paymentSig) {
      // No payment provided - return 402
      const amount = typeof options.amount === 'function' ? options.amount(req) : options.amount;
      const desc = typeof options.description === 'function' ? options.description(req) : options.description;
      
      const response = generate402Response(amount, desc);
      res.status(402).set(response.headers).json(response.body);
      return;
    }

    // Verify payment
    const amount = typeof options.amount === 'function' ? options.amount(req) : options.amount;
    const verification = await verifyPayment(paymentSig, amount);

    if (!verification.valid) {
      res.status(402).json({
        error: 'Payment verification failed',
        message: verification.error
      });
      return;
    }

    // Payment verified - proceed
    req.paymentTxHash = verification.txHash;
    next();
  };
}

/**
 * Log revenue for tracking
 */
export function logRevenue(type: string, amount: number, txHash?: string) {
  console.log(`💰 REVENUE: ${type} | $${amount.toFixed(2)} | ${txHash || 'pending'}`);
  // TODO: Store in database for reporting
}

// Example endpoint configurations
export const ENDPOINTS = {
  // Match creation - dynamic pricing based on stake
  createMatch: (stakeUSD: number) => ({
    amount: parseUnits(calculateRake(stakeUSD).total.toString(), USDC_DECIMALS),
    description: `Match entry: $${stakeUSD} stake + ${(calculateRake(stakeUSD).rake).toFixed(2)} platform fee`
  }),

  // Single evaluation
  eval: {
    amount: PRICES.MATCH_EVAL,
    description: 'Single game evaluation against benchmark'
  },

  // Replay access
  replay: {
    amount: PRICES.REPLAY_ACCESS,
    description: 'Match replay access'
  },

  // Analytics
  analytics: {
    amount: PRICES.ANALYTICS_REPORT,
    description: 'Detailed agent performance report'
  },

  // Priority queue
  priority: {
    amount: PRICES.PRIORITY_QUEUE,
    description: 'Skip queue - instant match'
  }
};
