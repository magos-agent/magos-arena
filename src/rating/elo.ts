/**
 * Elo Rating System
 * 
 * Implementation based on standard Elo with adjustable K-factor.
 * Used by chess, Chatbot Arena, and most competitive ranking systems.
 */

export interface Player {
  id: string;
  rating: number;
  gamesPlayed: number;
}

export interface EloConfig {
  /** Initial rating for new players */
  initialRating: number;
  /** K-factor for provisional players (< provisionalGames) */
  kFactorNew: number;
  /** K-factor for established players */
  kFactorEstablished: number;
  /** Number of games before player is "established" */
  provisionalGames: number;
}

const DEFAULT_CONFIG: EloConfig = {
  initialRating: 1500,
  kFactorNew: 32,
  kFactorEstablished: 16,
  provisionalGames: 30
};

/**
 * Calculate expected score (probability of winning)
 * Based on logistic curve with base 10 and scale factor 400
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Get K-factor for a player based on games played
 */
export function getKFactor(player: Player, config: EloConfig = DEFAULT_CONFIG): number {
  return player.gamesPlayed < config.provisionalGames
    ? config.kFactorNew
    : config.kFactorEstablished;
}

/**
 * Calculate new ratings after a match
 * 
 * @param playerA First player
 * @param playerB Second player
 * @param result 1 = A wins, 0.5 = draw, 0 = B wins
 * @param config Elo configuration
 * @returns New ratings for both players
 */
export function calculateNewRatings(
  playerA: Player,
  playerB: Player,
  result: 1 | 0.5 | 0,
  config: EloConfig = DEFAULT_CONFIG
): { newRatingA: number; newRatingB: number } {
  const expectedA = expectedScore(playerA.rating, playerB.rating);
  const expectedB = 1 - expectedA;
  
  const kA = getKFactor(playerA, config);
  const kB = getKFactor(playerB, config);
  
  const actualA = result;
  const actualB = 1 - result;
  
  const newRatingA = Math.round(playerA.rating + kA * (actualA - expectedA));
  const newRatingB = Math.round(playerB.rating + kB * (actualB - expectedB));
  
  return { newRatingA, newRatingB };
}

/**
 * Calculate rating change preview (without modifying players)
 */
export function previewRatingChange(
  ratingA: number,
  ratingB: number,
  result: 1 | 0.5 | 0,
  kFactor: number = 16
): { changeA: number; changeB: number } {
  const expectedA = expectedScore(ratingA, ratingB);
  const changeA = Math.round(kFactor * (result - expectedA));
  return { changeA, changeB: -changeA };
}

/**
 * Create a new player with initial rating
 */
export function createPlayer(id: string, config: EloConfig = DEFAULT_CONFIG): Player {
  return {
    id,
    rating: config.initialRating,
    gamesPlayed: 0
  };
}

/**
 * Update player after a match
 */
export function updatePlayer(player: Player, newRating: number): Player {
  return {
    ...player,
    rating: newRating,
    gamesPlayed: player.gamesPlayed + 1
  };
}

/**
 * Get human-readable rank based on rating
 */
export function getRank(rating: number): string {
  if (rating >= 2400) return 'Grandmaster';
  if (rating >= 2200) return 'Master';
  if (rating >= 2000) return 'Expert';
  if (rating >= 1800) return 'Class A';
  if (rating >= 1600) return 'Class B';
  if (rating >= 1400) return 'Class C';
  if (rating >= 1200) return 'Class D';
  return 'Novice';
}

/**
 * Calculate win probability for display purposes
 */
export function winProbability(ratingA: number, ratingB: number): { 
  winA: number; 
  draw: number; 
  winB: number 
} {
  const expected = expectedScore(ratingA, ratingB);
  // Simplified: assume draws are rare in Connect Four
  return {
    winA: expected,
    draw: 0.05, // Rough estimate
    winB: 1 - expected - 0.05
  };
}
