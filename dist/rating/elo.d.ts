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
/**
 * Calculate expected score (probability of winning)
 * Based on logistic curve with base 10 and scale factor 400
 */
export declare function expectedScore(ratingA: number, ratingB: number): number;
/**
 * Get K-factor for a player based on games played
 */
export declare function getKFactor(player: Player, config?: EloConfig): number;
/**
 * Calculate new ratings after a match
 *
 * @param playerA First player
 * @param playerB Second player
 * @param result 1 = A wins, 0.5 = draw, 0 = B wins
 * @param config Elo configuration
 * @returns New ratings for both players
 */
export declare function calculateNewRatings(playerA: Player, playerB: Player, result: 1 | 0.5 | 0, config?: EloConfig): {
    newRatingA: number;
    newRatingB: number;
};
/**
 * Calculate rating change preview (without modifying players)
 */
export declare function previewRatingChange(ratingA: number, ratingB: number, result: 1 | 0.5 | 0, kFactor?: number): {
    changeA: number;
    changeB: number;
};
/**
 * Create a new player with initial rating
 */
export declare function createPlayer(id: string, config?: EloConfig): Player;
/**
 * Update player after a match
 */
export declare function updatePlayer(player: Player, newRating: number): Player;
/**
 * Get human-readable rank based on rating
 */
export declare function getRank(rating: number): string;
/**
 * Calculate win probability for display purposes
 */
export declare function winProbability(ratingA: number, ratingB: number): {
    winA: number;
    draw: number;
    winB: number;
};
