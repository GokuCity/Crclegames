/**
 * Round Engine
 *
 * Manages round lifecycle: leaders, hostages, timers, parlay, and transitions.
 */

import { RoomId, ServerEventType, Result } from '@two-rooms/shared';
import { Game, Player, calculateHostageCount } from '../core/GameState';
import { eventBus } from '../services/EventBus';
import { StateMachine } from '../core/StateMachine';
import { gameStore } from '../services/GameStore';

// ============================================================================
// TIMER MANAGER
// ============================================================================

interface RoundTimer {
  gameId: string;
  duration: number;
  remaining: number;
  startTime: number;
  pausedAt?: number;
  state: 'RUNNING' | 'PAUSED' | 'STOPPED';
  interval: NodeJS.Timeout | null;
  onExpired?: () => void;
}

class TimerManager {
  private timers: Map<string, RoundTimer> = new Map();

  /**
   * Start a timer
   */
  startTimer(gameId: string, duration: number, onExpired?: () => void): void {
    // Clear existing timer if any
    this.stopTimer(gameId);

    const timer: RoundTimer = {
      gameId,
      duration,
      remaining: duration,
      startTime: Date.now(),
      state: 'RUNNING',
      interval: null,
      onExpired
    };

    // Server-side interval for ticking
    timer.interval = setInterval(() => {
      this.tick(gameId);
    }, 100); // 100ms granularity

    this.timers.set(gameId, timer);
    this.broadcastTimerState(gameId, timer);
  }

  /**
   * Tick timer
   */
  private tick(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (!timer || timer.state !== 'RUNNING') return;

    const elapsed = Date.now() - timer.startTime;
    timer.remaining = Math.max(0, timer.duration - elapsed);

    // Broadcast every second
    if (elapsed % 1000 < 100) {
      this.broadcastTimerState(gameId, timer);
    }

    // Timer expired
    if (timer.remaining <= 0) {
      const callback = timer.onExpired;
      this.stopTimer(gameId);
      if (callback) {
        callback();
      }
    }
  }

  /**
   * Pause timer
   */
  pauseTimer(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (!timer) return;

    // Calculate remaining time before pausing
    const elapsed = Date.now() - timer.startTime;
    timer.remaining = Math.max(0, timer.duration - elapsed);

    console.log('pauseTimer: Pausing timer', { gameId, elapsed, remaining: timer.remaining, duration: timer.duration });

    timer.state = 'PAUSED';
    timer.pausedAt = Date.now();

    if (timer.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
    }

    this.broadcastTimerState(gameId, timer);
  }

  /**
   * Resume timer
   */
  resumeTimer(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (!timer || timer.state !== 'PAUSED' || !timer.pausedAt) {
      console.warn('resumeTimer: Cannot resume timer', { gameId, timerState: timer?.state, hasPausedAt: !!timer?.pausedAt });
      return;
    }

    console.log('resumeTimer: Resuming timer', { gameId, remaining: timer.remaining, pausedAt: timer.pausedAt });

    // Adjust start time to account for pause
    const pauseDuration = Date.now() - timer.pausedAt;
    timer.startTime += pauseDuration;
    timer.state = 'RUNNING';

    timer.interval = setInterval(() => this.tick(gameId), 100);

    console.log('resumeTimer: Timer resumed successfully', { gameId, newState: timer.state });
    this.broadcastTimerState(gameId, timer);
  }

  /**
   * Stop timer
   */
  stopTimer(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (!timer) return;

    if (timer.interval) {
      clearInterval(timer.interval);
      timer.interval = null;
    }

    timer.state = 'STOPPED';
    this.timers.delete(gameId);
  }

  /**
   * Get timer state
   */
  getTimerState(gameId: string): RoundTimer | undefined {
    return this.timers.get(gameId);
  }

  /**
   * Broadcast timer state
   */
  private broadcastTimerState(gameId: string, timer: RoundTimer): void {
    // Update the game state's timer object
    const game = gameStore.get(gameId);
    if (game) {
      game.state.public.timer = {
        duration: timer.duration,
        remaining: timer.remaining,
        state: timer.state
      };
      gameStore.update(game);
    }

    eventBus.broadcast(
      gameId,
      ServerEventType.TIMER_UPDATE,
      {
        remaining: timer.remaining,
        state: timer.state
      },
      'PUBLIC'
    );
  }
}

// ============================================================================
// ROUND ENGINE
// ============================================================================

export class RoundEngine {
  private timerManager: TimerManager;
  private stateMachine: StateMachine;

  constructor(stateMachine: StateMachine) {
    this.timerManager = new TimerManager();
    this.stateMachine = stateMachine;
  }

  /**
   * Start a round
   */
  startRound(game: Game, roundNumber: number): void {
    game.state.public.currentRound = roundNumber;

    // Get round duration from config
    const duration = game.config.roundDurations[roundNumber - 1];

    // Reset round state
    game.state.rooms.ROOM_A.leaderVotes = {};
    game.state.rooms.ROOM_B.leaderVotes = {};
    game.state.rooms.ROOM_A.leaderVotingActive = roundNumber === 1; // Only active for round 1
    game.state.rooms.ROOM_B.leaderVotingActive = roundNumber === 1;
    game.state.rooms.ROOM_A.leaderVotingTieCount = 0;
    game.state.rooms.ROOM_B.leaderVotingTieCount = 0;
    game.state.rooms.ROOM_A.hostageCandidates = [];
    game.state.rooms.ROOM_B.hostageCandidates = [];
    game.state.rooms.ROOM_A.hostagesLocked = false;
    game.state.rooms.ROOM_B.hostagesLocked = false;

    // For round 1, DON'T start timer yet - wait for both leaders to be elected
    // For subsequent rounds, start timer immediately
    if (roundNumber === 1) {
      console.log(`Round 1 starting - timer will start after both leaders elected`);
      // Store duration for later
      game.state.public.timer = {
        duration,
        remaining: duration,
        state: 'PAUSED'
      };
    } else {
      // Start timer immediately for rounds 2+
      this.timerManager.startTimer(game.id, duration, () => {
        this.onRoundTimerExpired(game);
      });
    }

    // Broadcast round start
    eventBus.broadcast(
      game.id,
      ServerEventType.ROUND_STARTED,
      {
        round: roundNumber,
        duration
      },
      'PUBLIC'
    );

    console.log(`Round ${roundNumber} started for game ${game.id}`);
  }

  /**
   * End a round
   */
  async endRound(game: Game, reason: string = 'TIME_EXPIRED'): Promise<void> {
    const roundNumber = game.state.public.currentRound;

    // Stop timer
    this.timerManager.stopTimer(game.id);

    // Broadcast round end
    eventBus.broadcast(
      game.id,
      ServerEventType.ROUND_ENDED,
      {
        round: roundNumber,
        reason
      },
      'PUBLIC'
    );

    console.log(`Round ${roundNumber} ended for game ${game.id} (${reason})`);

    // Transition to next round or resolution
    await this.stateMachine.transition(game, 'ROUND_COMPLETE');

    // If we transitioned to next round, start it
    if (game.state.public.status.startsWith('ROUND_')) {
      const nextRound = this.stateMachine.getCurrentRoundNumber(
        game.state.public.status
      );
      if (nextRound) {
        this.startRound(game, nextRound);
      }
    }
  }

  /**
   * Handle round timer expiration
   */
  private onRoundTimerExpired(game: Game): void {
    console.log(`Round timer expired for game ${game.id}`);

    // Pause game for hostage selection
    game.state.public.paused = true;
    game.state.public.pauseReason = 'Waiting for leaders to select hostages';

    // Broadcast that hostage selection phase has started
    eventBus.broadcast(game.id, ServerEventType.GAME_PAUSED, {
      reason: 'Hostage selection phase'
    }, 'PUBLIC');

    console.log(`Game ${game.id} paused for hostage selection`);
  }

  /**
   * Nominate leader (vote-based system)
   */
  nominateLeader(
    game: Game,
    roomId: RoomId,
    candidateId: string,
    voterId?: string
  ): Result<void> {
    const room = game.state.rooms[roomId];

    // If leader already exists and voting is not active, don't allow new nominations
    if (room.leaderId && !room.leaderVotingActive) {
      return {
        success: false,
        error: 'Leader already exists. Use "Vote for New Leader" button to start a new vote.'
      };
    }

    // Validate candidate is in room
    if (!room.players.includes(candidateId)) {
      return {
        success: false,
        error: 'Candidate not in room'
      };
    }

    // If voterId provided, validate voter is in room
    if (voterId && !room.players.includes(voterId)) {
      return { success: false, error: 'Voter not in room' };
    }

    // Record vote (use voterId if provided, otherwise candidateId votes for themselves)
    const actualVoterId = voterId || candidateId;
    room.leaderVotes[actualVoterId] = candidateId;

    // Broadcast vote cast
    eventBus.broadcastToRoom(game.id, roomId, ServerEventType.VOTE_CAST, {
      roomId,
      totalVotes: Object.keys(room.leaderVotes).length,
      totalPlayers: room.players.length
    });

    // Check if all players have voted
    if (Object.keys(room.leaderVotes).length === room.players.length) {
      return this.resolveLeaderVote(game, roomId);
    }

    return { success: true };
  }

  /**
   * Resolve leader vote (check for tie or winner)
   */
  private resolveLeaderVote(game: Game, roomId: RoomId): Result<void> {
    const room = game.state.rooms[roomId];

    // Count votes for each candidate
    const voteCounts: Record<string, number> = {};
    for (const candidateId of Object.values(room.leaderVotes)) {
      voteCounts[candidateId] = (voteCounts[candidateId] || 0) + 1;
    }

    // Find the maximum vote count
    const maxVotes = Math.max(...Object.values(voteCounts));
    const winners = Object.keys(voteCounts).filter(
      (candidateId) => voteCounts[candidateId] === maxVotes
    );

    // Check for tie
    if (winners.length > 1) {
      room.leaderVotingTieCount++;

      // After 3 ties, randomly select a leader
      if (room.leaderVotingTieCount >= 3) {
        const randomIndex = Math.floor(Math.random() * winners.length);
        const selectedLeader = winners[randomIndex];

        return this.electLeader(game, roomId, selectedLeader, 'RANDOM_SELECTION');
      }

      // Broadcast tie notification
      eventBus.broadcastToRoom(game.id, roomId, ServerEventType.LEADER_ELECTED, {
        roomId,
        tied: true,
        tieCount: room.leaderVotingTieCount,
        candidates: winners
      });

      // Clear votes for revote
      room.leaderVotes = {};
      room.leaderVotingActive = true;

      return {
        success: false,
        error: `Tie detected (${room.leaderVotingTieCount}/3). Please vote again.`,
        context: {
          tied: true,
          tieCount: room.leaderVotingTieCount,
          candidates: winners
        }
      };
    }

    // We have a winner!
    const winnerId = winners[0];
    return this.electLeader(game, roomId, winnerId, 'MAJORITY_VOTE');
  }

  /**
   * Elect a leader
   */
  private electLeader(
    game: Game,
    roomId: RoomId,
    leaderId: string,
    method: 'MAJORITY_VOTE' | 'RANDOM_SELECTION'
  ): Result<void> {
    const room = game.state.rooms[roomId];

    // Clear old leader's status if there was one
    const oldLeaderId = room.leaderId;
    if (oldLeaderId && oldLeaderId !== leaderId) {
      const oldLeader = game.players.get(oldLeaderId);
      if (oldLeader) {
        oldLeader.isLeader = false;
        oldLeader.canBeHostage = true;
        console.log(`Old leader ${oldLeaderId} has been removed from leadership`);
      }
    }

    // Set new leader
    room.leaderId = leaderId;
    game.state.public.leaders[roomId] = leaderId;
    room.leaderVotingActive = false;
    room.leaderVotingTieCount = 0;

    const player = game.players.get(leaderId);
    if (player) {
      player.isLeader = true;
      player.canBeHostage = false;
    }

    // Broadcast leader elected
    eventBus.broadcastToRoom(game.id, roomId, ServerEventType.LEADER_ELECTED, {
      roomId,
      leaderId,
      method,
      tied: false
    });

    // If this is round 1 and both rooms have leaders, START the timer (not resume)
    if (game.state.public.currentRound === 1) {
      const roomA = game.state.rooms.ROOM_A;
      const roomB = game.state.rooms.ROOM_B;

      console.log('electLeader: Checking if timer should start', {
        gameId: game.id,
        currentRound: game.state.public.currentRound,
        roomALeader: roomA.leaderId,
        roomBLeader: roomB.leaderId
      });

      if (roomA.leaderId && roomB.leaderId) {
        // Both leaders elected, START the timer
        const duration = game.config.roundDurations[0]; // Round 1 duration
        console.log('electLeader: Both leaders elected, starting timer with duration:', duration);

        this.timerManager.startTimer(game.id, duration, () => {
          this.onRoundTimerExpired(game);
        });

        // Broadcast that game is starting
        eventBus.broadcast(game.id, ServerEventType.GAME_RESUMED, {
          reason: 'Both leaders elected - round starting!'
        }, 'PUBLIC');

        console.log('electLeader: Timer started successfully for game', game.id);
      }
    } else if (game.state.public.currentRound > 1 && oldLeaderId) {
      // Resume timer after vote completes in rounds 2+ (whether leader changed or not)
      console.log(`electLeader: Vote completed in round ${game.state.public.currentRound}, resuming timer`);
      this.timerManager.resumeTimer(game.id);

      // Broadcast that game is resuming
      const message = oldLeaderId !== leaderId
        ? 'New leader elected - round resuming!'
        : 'Leader vote completed - round resuming!';

      eventBus.broadcast(game.id, ServerEventType.GAME_RESUMED, {
        reason: message
      }, 'PUBLIC');
    }

    return { success: true };
  }

  /**
   * Initiate a new leader vote (for subsequent rounds)
   */
  initiateNewLeaderVote(game: Game, roomId: RoomId, playerId: string): Result<void> {
    const room = game.state.rooms[roomId];

    // Validate player is in room
    if (!room.players.includes(playerId)) {
      return { success: false, error: 'Player not in room' };
    }

    // Can only initiate if there's an existing leader
    if (!room.leaderId) {
      return { success: false, error: 'No leader to replace' };
    }

    // Can only initiate if voting is not already active
    if (room.leaderVotingActive) {
      return { success: false, error: 'Voting already in progress' };
    }

    // Pause the timer
    this.timerManager.pauseTimer(game.id);
    console.log(`Timer paused for leader vote in room ${roomId} of game ${game.id}`);

    // Activate voting
    room.leaderVotingActive = true;
    room.leaderVotingTieCount = 0;
    room.leaderVotes = {};

    // Broadcast that new vote has started
    eventBus.broadcastToRoom(game.id, roomId, ServerEventType.LEADER_ELECTED, {
      roomId,
      votingStarted: true,
      totalPlayers: room.players.length
    });

    return { success: true };
  }

  /**
   * Vote to usurp leader
   */
  voteUsurp(
    game: Game,
    roomId: RoomId,
    voterId: string,
    candidateId: string
  ): Result<void> {
    const room = game.state.rooms[roomId];

    // Validate voter is in room
    if (!room.players.includes(voterId)) {
      return { success: false, error: 'Voter not in room' };
    }

    // Validate candidate is in room
    if (!room.players.includes(candidateId)) {
      return { success: false, error: 'Candidate not in room' };
    }

    // Record vote
    room.leaderVotes[voterId] = candidateId;

    // Check for majority
    const votesNeeded = Math.floor(room.players.length / 2) + 1;
    const voteCount = this.countVotesFor(candidateId, room.leaderVotes);

    if (voteCount >= votesNeeded) {
      // Usurp successful!
      return this.usurpLeader(game, roomId, candidateId);
    }

    // Broadcast vote cast (but not who voted for whom)
    eventBus.broadcastToRoom(game.id, roomId, ServerEventType.VOTE_CAST, {
      roomId,
      totalVotes: Object.keys(room.leaderVotes).length,
      votesNeeded
    });

    return { success: true };
  }

  /**
   * Execute leader usurpation
   */
  private usurpLeader(
    game: Game,
    roomId: RoomId,
    newLeaderId: string
  ): Result<void> {
    const room = game.state.rooms[roomId];
    const oldLeaderId = room.leaderId;

    // Remove old leader status
    if (oldLeaderId) {
      const oldLeader = game.players.get(oldLeaderId);
      if (oldLeader) {
        oldLeader.isLeader = false;
        oldLeader.canBeHostage = true;
      }
    }

    // Set new leader
    room.leaderId = newLeaderId;
    game.state.public.leaders[roomId] = newLeaderId;

    const newLeader = game.players.get(newLeaderId);
    if (newLeader) {
      newLeader.isLeader = true;
      newLeader.canBeHostage = false;
      newLeader.usurpedLeadersCount++;
    }

    // Clear votes
    room.leaderVotes = {};

    // Track for Anarchist win condition
    this.recordUsurpation(game, newLeaderId);

    // Broadcast
    eventBus.broadcastToRoom(game.id, roomId, ServerEventType.LEADER_USURPED, {
      roomId,
      oldLeaderId,
      newLeaderId,
      round: game.state.public.currentRound
    });

    return { success: true };
  }

  /**
   * Abdicate leadership
   */
  abdicate(
    game: Game,
    roomId: RoomId,
    currentLeaderId: string,
    newLeaderId: string
  ): Result<void> {
    const room = game.state.rooms[roomId];

    // Validate current leader
    if (room.leaderId !== currentLeaderId) {
      return { success: false, error: 'You are not the leader' };
    }

    // Validate new leader is in room
    if (!room.players.includes(newLeaderId)) {
      return { success: false, error: 'New leader not in room' };
    }

    // Transfer leadership
    const oldLeader = game.players.get(currentLeaderId);
    if (oldLeader) {
      oldLeader.isLeader = false;
      oldLeader.canBeHostage = true;
    }

    room.leaderId = newLeaderId;
    game.state.public.leaders[roomId] = newLeaderId;

    const newLeader = game.players.get(newLeaderId);
    if (newLeader) {
      newLeader.isLeader = true;
      newLeader.canBeHostage = false;
    }

    // Broadcast
    eventBus.broadcastToRoom(
      game.id,
      roomId,
      ServerEventType.LEADER_ABDICATED,
      {
        roomId,
        oldLeaderId: currentLeaderId,
        newLeaderId
      }
    );

    return { success: true };
  }

  /**
   * Select hostage (or deselect if already selected)
   */
  selectHostage(
    game: Game,
    roomId: RoomId,
    hostageId: string
  ): Result<void> {
    const room = game.state.rooms[roomId];

    // Check if already locked
    if (room.hostagesLocked) {
      return { success: false, error: 'Hostages already locked' };
    }

    // Check hostage limit
    const hostageCount = calculateHostageCount(
      game.players.size,
      game.state.public.currentRound
    );

    // If already selected, deselect
    if (room.hostageCandidates.includes(hostageId)) {
      room.hostageCandidates = room.hostageCandidates.filter((id) => id !== hostageId);

      eventBus.broadcastToRoom(
        game.id,
        roomId,
        ServerEventType.HOSTAGE_SELECTED,
        {
          roomId,
          count: room.hostageCandidates.length,
          required: hostageCount,
          deselected: true
        }
      );

      return { success: true };
    }

    // Check if limit reached
    if (room.hostageCandidates.length >= hostageCount) {
      return { success: false, error: 'Hostage limit reached. Deselect another hostage first.' };
    }

    // Add to candidates
    room.hostageCandidates.push(hostageId);

    // Broadcast
    eventBus.broadcastToRoom(
      game.id,
      roomId,
      ServerEventType.HOSTAGE_SELECTED,
      {
        roomId,
        count: room.hostageCandidates.length,
        required: hostageCount
      }
    );

    return { success: true };
  }

  /**
   * Lock hostages
   */
  lockHostages(game: Game, roomId: RoomId): Result<void> {
    const room = game.state.rooms[roomId];
    const hostageCount = calculateHostageCount(
      game.players.size,
      game.state.public.currentRound
    );

    // Validate count
    if (room.hostageCandidates.length !== hostageCount) {
      return {
        success: false,
        error: `Must select exactly ${hostageCount} hostages`
      };
    }

    // Lock
    room.hostagesLocked = true;

    // Broadcast
    eventBus.broadcastToRoom(
      game.id,
      roomId,
      ServerEventType.HOSTAGES_LOCKED,
      {
        roomId
      }
    );

    // Check if both rooms locked -> start parlay
    if (this.bothRoomsLocked(game)) {
      this.startParlay(game);
    }

    return { success: true };
  }

  /**
   * Start parlay
   */
  private startParlay(game: Game): void {
    // Pause main timer
    this.timerManager.pauseTimer(game.id);

    // Start parlay timer (30 seconds)
    this.timerManager.startTimer(`${game.id}_parlay`, 30000, () => {
      this.endParlay(game);
    });

    game.state.public.parlayActive = true;

    const leaderA = game.state.rooms.ROOM_A.leaderId;
    const leaderB = game.state.rooms.ROOM_B.leaderId;

    // Broadcast
    eventBus.broadcast(
      game.id,
      ServerEventType.PARLAY_STARTED,
      {
        leaderA,
        leaderB
      },
      'PUBLIC'
    );
  }

  /**
   * End parlay
   */
  private endParlay(game: Game): void {
    this.timerManager.stopTimer(`${game.id}_parlay`);
    game.state.public.parlayActive = false;

    eventBus.broadcast(game.id, ServerEventType.PARLAY_ENDED, {}, 'PUBLIC');

    // Exchange hostages
    this.exchangeHostages(game);
  }

  /**
   * Exchange hostages
   */
  private exchangeHostages(game: Game): void {
    const roomA = game.state.rooms.ROOM_A;
    const roomB = game.state.rooms.ROOM_B;

    const hostagesFromA = [...roomA.hostageCandidates];
    const hostagesFromB = [...roomB.hostageCandidates];

    // Swap rooms
    for (const playerId of hostagesFromA) {
      const player = game.players.get(playerId);
      if (player) {
        player.currentRoom = RoomId.ROOM_B;
        player.wasSentAsHostage = true;

        // Update room membership
        roomA.players = roomA.players.filter((id) => id !== playerId);
        roomB.players.push(playerId);
      }
    }

    for (const playerId of hostagesFromB) {
      const player = game.players.get(playerId);
      if (player) {
        player.currentRoom = RoomId.ROOM_A;
        player.wasSentAsHostage = true;

        // Update room membership
        roomB.players = roomB.players.filter((id) => id !== playerId);
        roomA.players.push(playerId);
      }
    }

    // Update room assignments in public state
    for (const [playerId, player] of game.players) {
      if (player.currentRoom) {
        game.state.public.roomAssignments[playerId] = player.currentRoom;
      }
    }

    // Broadcast
    eventBus.broadcast(
      game.id,
      ServerEventType.HOSTAGES_EXCHANGED,
      {
        fromA: hostagesFromA,
        fromB: hostagesFromB
      },
      'PUBLIC'
    );

    // Reset for next round
    roomA.hostageCandidates = [];
    roomA.hostagesLocked = false;
    roomB.hostageCandidates = [];
    roomB.hostagesLocked = false;

    // Unpause game
    game.state.public.paused = false;
    game.state.public.pauseReason = null;

    // End current round and transition to next
    console.log(`Hostage exchange complete for game ${game.id}, ending round`);
    this.endRound(game, 'HOSTAGES_EXCHANGED');
  }

  /**
   * Check if both rooms have locked hostages
   */
  private bothRoomsLocked(game: Game): boolean {
    return (
      game.state.rooms.ROOM_A.hostagesLocked &&
      game.state.rooms.ROOM_B.hostagesLocked
    );
  }

  /**
   * Count votes for a candidate
   */
  private countVotesFor(
    candidateId: string,
    votes: Record<string, string>
  ): number {
    return Object.values(votes).filter((v) => v === candidateId).length;
  }

  /**
   * Record usurpation for Anarchist win condition
   */
  private recordUsurpation(game: Game, usurperId: string): void {
    const round = game.state.public.currentRound;
    if (!game.state.private.usurpations[round]) {
      game.state.private.usurpations[round] = [];
    }
    game.state.private.usurpations[round].push(usurperId);
  }

  /**
   * Pause game
   */
  pauseGame(game: Game, reason: string): void {
    this.timerManager.pauseTimer(game.id);
    game.state.public.paused = true;
    game.state.public.pauseReason = reason;

    eventBus.broadcast(
      game.id,
      ServerEventType.GAME_PAUSED,
      { reason },
      'PUBLIC'
    );
  }

  /**
   * Resume game
   */
  resumeGame(game: Game): void {
    this.timerManager.resumeTimer(game.id);
    game.state.public.paused = false;
    game.state.public.pauseReason = null;

    eventBus.broadcast(game.id, ServerEventType.GAME_RESUMED, {}, 'PUBLIC');
  }
}
