/**
 * Elo Milestone Rewards - Incentivize ladder climbing
 */

import { Hono } from 'hono';
import { agents } from './agents';
import { balances } from './payments';

export const milestonesRouter = new Hono();

// Milestone definitions
const MILESTONES = [
  { rating: 1600, reward: 0.50, name: 'Class B', emoji: '🥉' },
  { rating: 1800, reward: 1.00, name: 'Class A', emoji: '🥈' },
  { rating: 2000, reward: 2.00, name: 'Expert', emoji: '🥇' },
  { rating: 2200, reward: 5.00, name: 'Master', emoji: '🏆' },
  { rating: 2400, reward: 10.00, name: 'Grandmaster', emoji: '👑' },
];

// Track which milestones each agent has claimed
const claimedMilestones: Map<string, Set<number>> = new Map();

// Track milestone history
const milestoneHistory: Array<{
  agentId: string;
  agentName: string;
  milestone: number;
  milestoneName: string;
  reward: number;
  claimedAt: string;
}> = [];

// Check and claim milestones for an agent
milestonesRouter.post('/check/:agentId', async (c) => {
  const agentId = c.req.param('agentId');
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const claimed = claimedMilestones.get(agentId) || new Set();
  const newlyUnlocked: typeof MILESTONES = [];
  let totalReward = 0;
  
  for (const milestone of MILESTONES) {
    if (agent.rating >= milestone.rating && !claimed.has(milestone.rating)) {
      // Claim this milestone!
      claimed.add(milestone.rating);
      newlyUnlocked.push(milestone);
      totalReward += milestone.reward;
      
      // Record in history
      milestoneHistory.unshift({
        agentId,
        agentName: agent.name,
        milestone: milestone.rating,
        milestoneName: milestone.name,
        reward: milestone.reward,
        claimedAt: new Date().toISOString()
      });
    }
  }
  
  claimedMilestones.set(agentId, claimed);
  
  // Credit rewards
  if (totalReward > 0) {
    const currentBalance = balances.get(agentId) || 0;
    balances.set(agentId, currentBalance + totalReward);
  }
  
  // Calculate next milestone
  const nextMilestone = MILESTONES.find(m => agent.rating < m.rating);
  const ratingToNext = nextMilestone ? nextMilestone.rating - agent.rating : 0;
  
  return c.json({
    agentId,
    name: agent.name,
    currentRating: agent.rating,
    newlyUnlocked: newlyUnlocked.map(m => ({
      rating: m.rating,
      name: m.name,
      emoji: m.emoji,
      reward: m.reward
    })),
    totalRewardClaimed: totalReward,
    newBalance: totalReward > 0 ? (balances.get(agentId) || 0).toFixed(6) : undefined,
    nextMilestone: nextMilestone ? {
      rating: nextMilestone.rating,
      name: nextMilestone.name,
      emoji: nextMilestone.emoji,
      reward: nextMilestone.reward,
      ratingNeeded: ratingToNext
    } : null,
    allClaimed: Array.from(claimed).sort((a, b) => a - b)
  });
});

// Get milestone status for an agent
milestonesRouter.get('/status/:agentId', (c) => {
  const agentId = c.req.param('agentId');
  
  const agent = agents.get(agentId);
  if (!agent) {
    return c.json({ error: 'Agent not found' }, 404);
  }
  
  const claimed = claimedMilestones.get(agentId) || new Set();
  
  const milestoneStatus = MILESTONES.map(m => ({
    rating: m.rating,
    name: m.name,
    emoji: m.emoji,
    reward: m.reward,
    achieved: agent.rating >= m.rating,
    claimed: claimed.has(m.rating),
    canClaim: agent.rating >= m.rating && !claimed.has(m.rating)
  }));
  
  const nextMilestone = MILESTONES.find(m => agent.rating < m.rating);
  const progress = nextMilestone 
    ? {
        next: nextMilestone,
        ratingNeeded: nextMilestone.rating - agent.rating,
        percentComplete: Math.min(100, Math.round(
          ((agent.rating - (MILESTONES.find(m => m.rating < nextMilestone.rating)?.rating || 1500)) / 
          (nextMilestone.rating - (MILESTONES.find(m => m.rating < nextMilestone.rating)?.rating || 1500))) * 100
        ))
      }
    : null;
  
  return c.json({
    agentId,
    name: agent.name,
    currentRating: agent.rating,
    milestones: milestoneStatus,
    progress,
    totalEarned: milestoneStatus.filter(m => m.claimed).reduce((sum, m) => sum + m.reward, 0),
    totalAvailable: milestoneStatus.filter(m => m.canClaim).reduce((sum, m) => sum + m.reward, 0)
  });
});

// Get all milestones info
milestonesRouter.get('/', (c) => {
  return c.json({
    milestones: MILESTONES,
    totalRewardsPool: MILESTONES.reduce((sum, m) => sum + m.reward, 0),
    description: 'Reach rating milestones to earn USDC rewards! Rewards are automatically available when you hit the threshold.',
    recentClaims: milestoneHistory.slice(0, 20)
  });
});

// Leaderboard of milestone achievers
milestonesRouter.get('/leaderboard', (c) => {
  const agentList = Array.from(agents.values())
    .map(agent => {
      const claimed = claimedMilestones.get(agent.id) || new Set();
      const highestMilestone = MILESTONES.filter(m => claimed.has(m.rating)).pop();
      return {
        agentId: agent.id,
        name: agent.name,
        rating: agent.rating,
        highestMilestone: highestMilestone?.name || 'None',
        milestonesAchieved: claimed.size,
        totalEarned: MILESTONES.filter(m => claimed.has(m.rating)).reduce((sum, m) => sum + m.reward, 0)
      };
    })
    .filter(a => a.milestonesAchieved > 0)
    .sort((a, b) => b.milestonesAchieved - a.milestonesAchieved || b.rating - a.rating);
  
  return c.json({
    leaderboard: agentList,
    totalMilestonesAwarded: milestoneHistory.length,
    totalRewardsPaid: milestoneHistory.reduce((sum, h) => sum + h.reward, 0)
  });
});

// Hook to check milestones after a match (called from arena/stakes)
export function checkMilestonesAfterMatch(agentId: string): {
  unlocked: { rating: number; name: string; reward: number }[];
  totalReward: number;
} | null {
  const agent = agents.get(agentId);
  if (!agent) return null;
  
  const claimed = claimedMilestones.get(agentId) || new Set();
  const unlocked: { rating: number; name: string; reward: number }[] = [];
  let totalReward = 0;
  
  for (const milestone of MILESTONES) {
    if (agent.rating >= milestone.rating && !claimed.has(milestone.rating)) {
      claimed.add(milestone.rating);
      unlocked.push({
        rating: milestone.rating,
        name: milestone.name,
        reward: milestone.reward
      });
      totalReward += milestone.reward;
      
      milestoneHistory.unshift({
        agentId,
        agentName: agent.name,
        milestone: milestone.rating,
        milestoneName: milestone.name,
        reward: milestone.reward,
        claimedAt: new Date().toISOString()
      });
    }
  }
  
  if (unlocked.length > 0) {
    claimedMilestones.set(agentId, claimed);
    const currentBalance = balances.get(agentId) || 0;
    balances.set(agentId, currentBalance + totalReward);
    return { unlocked, totalReward };
  }
  
  return null;
}

export { MILESTONES, claimedMilestones, milestoneHistory };
