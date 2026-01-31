// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MatchEscrow
 * @notice Escrow contract for Agent Arena matches
 * @dev Both agents lock stake. Winner takes all (minus rake).
 *      No trust required. Bots can audit this code.
 */
contract MatchEscrow is ReentrancyGuard {
    
    // USDC on Base
    IERC20 public immutable usdc;
    
    // Treasury (where rake goes)
    address public immutable treasury;
    
    // Rake in basis points (1000 = 10%)
    uint256 public rakeRate;
    
    // Match states
    enum MatchState { Open, Funded, Running, Complete, Cancelled }
    
    struct Match {
        bytes32 matchId;
        address agentA;
        address agentB;
        uint256 stake;          // Per-player stake
        uint256 rakeAmount;     // Platform cut
        MatchState state;
        address winner;
        uint256 createdAt;
        uint256 completedAt;
    }
    
    // matchId => Match
    mapping(bytes32 => Match) public matches;
    
    // Agent deposits (matchId => agent => deposited)
    mapping(bytes32 => mapping(address => bool)) public deposits;
    
    // Events
    event MatchCreated(bytes32 indexed matchId, address indexed agentA, uint256 stake, uint256 rake);
    event AgentJoined(bytes32 indexed matchId, address indexed agent);
    event MatchStarted(bytes32 indexed matchId, address agentA, address agentB);
    event MatchCompleted(bytes32 indexed matchId, address indexed winner, uint256 payout);
    event MatchCancelled(bytes32 indexed matchId, address indexed agent, string reason);
    event RakeCollected(bytes32 indexed matchId, uint256 amount);
    
    // Errors
    error InvalidStake();
    error MatchNotFound();
    error MatchNotOpen();
    error MatchNotFunded();
    error AlreadyDeposited();
    error NotAuthorized();
    error TransferFailed();
    
    constructor(address _usdc, address _treasury, uint256 _rakeRate) {
        usdc = IERC20(_usdc);
        treasury = _treasury;
        rakeRate = _rakeRate;
    }
    
    /**
     * @notice Create a new match and deposit stake
     * @param _stake Stake amount in USDC (6 decimals)
     * @return matchId Unique match identifier
     */
    function createMatch(uint256 _stake) external nonReentrant returns (bytes32 matchId) {
        if (_stake == 0) revert InvalidStake();
        
        // Calculate rake
        uint256 rake = (_stake * rakeRate) / 10000;
        uint256 totalRequired = _stake + rake;
        
        // Generate match ID
        matchId = keccak256(abi.encodePacked(
            msg.sender,
            _stake,
            block.timestamp,
            block.number
        ));
        
        // Create match
        matches[matchId] = Match({
            matchId: matchId,
            agentA: msg.sender,
            agentB: address(0),
            stake: _stake,
            rakeAmount: rake,
            state: MatchState.Open,
            winner: address(0),
            createdAt: block.timestamp,
            completedAt: 0
        });
        
        // Transfer USDC from agent
        if (!usdc.transferFrom(msg.sender, address(this), totalRequired)) {
            revert TransferFailed();
        }
        
        deposits[matchId][msg.sender] = true;
        
        emit MatchCreated(matchId, msg.sender, _stake, rake);
    }
    
    /**
     * @notice Join an existing match
     * @param matchId Match to join
     */
    function joinMatch(bytes32 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        
        if (m.matchId == bytes32(0)) revert MatchNotFound();
        if (m.state != MatchState.Open) revert MatchNotOpen();
        if (deposits[matchId][msg.sender]) revert AlreadyDeposited();
        if (msg.sender == m.agentA) revert NotAuthorized();
        
        uint256 totalRequired = m.stake + m.rakeAmount;
        
        // Transfer USDC from joining agent
        if (!usdc.transferFrom(msg.sender, address(this), totalRequired)) {
            revert TransferFailed();
        }
        
        deposits[matchId][msg.sender] = true;
        m.agentB = msg.sender;
        m.state = MatchState.Funded;
        
        emit AgentJoined(matchId, msg.sender);
        emit MatchStarted(matchId, m.agentA, m.agentB);
    }
    
    /**
     * @notice Report match result (called by oracle/game server)
     * @param matchId Match ID
     * @param winner Winner's address
     */
    function reportResult(bytes32 matchId, address winner) external nonReentrant {
        // TODO: Add oracle/game server authorization
        
        Match storage m = matches[matchId];
        
        if (m.matchId == bytes32(0)) revert MatchNotFound();
        if (m.state != MatchState.Funded) revert MatchNotFunded();
        if (winner != m.agentA && winner != m.agentB) revert NotAuthorized();
        
        m.winner = winner;
        m.state = MatchState.Complete;
        m.completedAt = block.timestamp;
        
        // Calculate payouts
        uint256 totalStake = m.stake * 2;
        uint256 totalRake = m.rakeAmount * 2;
        uint256 winnerPayout = totalStake; // Winner gets both stakes
        
        // Transfer winnings to winner
        if (!usdc.transfer(winner, winnerPayout)) {
            revert TransferFailed();
        }
        
        // Transfer rake to treasury
        if (!usdc.transfer(treasury, totalRake)) {
            revert TransferFailed();
        }
        
        emit MatchCompleted(matchId, winner, winnerPayout);
        emit RakeCollected(matchId, totalRake);
    }
    
    /**
     * @notice Cancel match and refund (only if not yet started)
     * @param matchId Match to cancel
     */
    function cancelMatch(bytes32 matchId) external nonReentrant {
        Match storage m = matches[matchId];
        
        if (m.matchId == bytes32(0)) revert MatchNotFound();
        if (m.state != MatchState.Open) revert MatchNotOpen();
        if (msg.sender != m.agentA) revert NotAuthorized();
        
        m.state = MatchState.Cancelled;
        
        // Refund agent A (stake + rake)
        uint256 refund = m.stake + m.rakeAmount;
        if (!usdc.transfer(m.agentA, refund)) {
            revert TransferFailed();
        }
        
        emit MatchCancelled(matchId, msg.sender, "Creator cancelled");
    }
    
    /**
     * @notice Get match details
     */
    function getMatch(bytes32 matchId) external view returns (Match memory) {
        return matches[matchId];
    }
    
    /**
     * @notice Update rake rate (only owner - TODO: add access control)
     */
    function setRakeRate(uint256 newRate) external {
        // TODO: Add owner check
        require(newRate <= 2000, "Max 20% rake"); // Sanity check
        rakeRate = newRate;
    }
}
