/**
 * State Machine
 *
 * Manages game state transitions with guards and actions.
 */

import { GameStatus } from '@two-rooms/shared';
import { Game } from './GameState';
import { Result } from '@two-rooms/shared';

// ============================================================================
// STATE TRANSITION
// ============================================================================

export type GuardFunction = (game: Game) => boolean;
export type ActionFunction = (game: Game) => void | Promise<void>;

export interface StateTransition {
  from: GameStatus | GameStatus[];
  to: GameStatus;
  trigger: string;
  guard?: GuardFunction;
  action?: ActionFunction;
}

// ============================================================================
// STATE MACHINE
// ============================================================================

export class StateMachine {
  private transitions: StateTransition[] = [];

  constructor() {
    this.initializeTransitions();
  }

  /**
   * Initialize all state transitions
   */
  private initializeTransitions(): void {
    // LOBBY → LOCKED
    this.addTransition({
      from: GameStatus.LOBBY,
      to: GameStatus.LOCKED,
      trigger: 'LOCK_ROOM',
      guard: (game) => {
        const playerCount = game.players.size;
        return playerCount >= 6 && playerCount <= 30;
      }
    });

    // LOCKED → LOBBY
    this.addTransition({
      from: GameStatus.LOCKED,
      to: GameStatus.LOBBY,
      trigger: 'UNLOCK_ROOM',
      guard: (game) => {
        // Can only unlock if no roles have been assigned yet
        return Object.keys(game.state.private.roleAssignments).length === 0;
      }
    });

    // LOCKED → ROLE_SELECTION
    this.addTransition({
      from: GameStatus.LOCKED,
      to: GameStatus.ROLE_SELECTION,
      trigger: 'START_ROLE_SELECTION'
    });

    // ROLE_SELECTION → LOCKED
    this.addTransition({
      from: GameStatus.ROLE_SELECTION,
      to: GameStatus.LOCKED,
      trigger: 'CANCEL_ROLE_SELECTION'
    });

    // ROLE_SELECTION → ROLE_DISTRIBUTION
    this.addTransition({
      from: GameStatus.ROLE_SELECTION,
      to: GameStatus.ROLE_DISTRIBUTION,
      trigger: 'CONFIRM_ROLES',
      guard: (game) => {
        // Validation will be done by ValidationEngine before this is called
        return true;
      }
    });

    // ROLE_DISTRIBUTION → ROOM_ASSIGNMENT
    this.addTransition({
      from: GameStatus.ROLE_DISTRIBUTION,
      to: GameStatus.ROOM_ASSIGNMENT,
      trigger: 'ROLES_DISTRIBUTED',
      guard: (game) => {
        // All players must have roles assigned
        return game.players.size === Object.keys(game.state.private.roleAssignments).length;
      }
    });

    // ROOM_ASSIGNMENT → ROUND_1
    this.addTransition({
      from: GameStatus.ROOM_ASSIGNMENT,
      to: GameStatus.ROUND_1,
      trigger: 'START_GAME',
      guard: (game) => {
        // Rooms must be balanced
        const roomA = game.state.rooms.ROOM_A.players.length;
        const roomB = game.state.rooms.ROOM_B.players.length;
        return Math.abs(roomA - roomB) <= 1;
      }
    });

    // Round transitions (dynamic based on totalRounds)
    this.addRoundTransitions();

    // Instant win from any round
    const roundStates = [
      GameStatus.ROUND_1,
      GameStatus.ROUND_2,
      GameStatus.ROUND_3,
      GameStatus.ROUND_4,
      GameStatus.ROUND_5
    ];

    this.addTransition({
      from: roundStates,
      to: GameStatus.RESOLUTION,
      trigger: 'INSTANT_WIN'
    });

    // RESOLUTION → FINISHED
    this.addTransition({
      from: GameStatus.RESOLUTION,
      to: GameStatus.FINISHED,
      trigger: 'WIN_CONDITIONS_RESOLVED'
    });
  }

  /**
   * Add round transitions dynamically
   */
  private addRoundTransitions(): void {
    // ROUND_1 → ROUND_2
    this.addTransition({
      from: GameStatus.ROUND_1,
      to: GameStatus.ROUND_2,
      trigger: 'ROUND_COMPLETE',
      guard: (game) => this.hostagesExchanged(game)
    });

    // ROUND_2 → ROUND_3
    this.addTransition({
      from: GameStatus.ROUND_2,
      to: GameStatus.ROUND_3,
      trigger: 'ROUND_COMPLETE',
      guard: (game) => this.hostagesExchanged(game)
    });

    // ROUND_3 → RESOLUTION (if 3-round game)
    this.addTransition({
      from: GameStatus.ROUND_3,
      to: GameStatus.RESOLUTION,
      trigger: 'ROUND_COMPLETE',
      guard: (game) =>
        game.config.totalRounds === 3 && this.hostagesExchanged(game)
    });

    // ROUND_3 → ROUND_4 (if 5-round game)
    this.addTransition({
      from: GameStatus.ROUND_3,
      to: GameStatus.ROUND_4,
      trigger: 'ROUND_COMPLETE',
      guard: (game) =>
        game.config.totalRounds === 5 && this.hostagesExchanged(game)
    });

    // ROUND_4 → ROUND_5
    this.addTransition({
      from: GameStatus.ROUND_4,
      to: GameStatus.ROUND_5,
      trigger: 'ROUND_COMPLETE',
      guard: (game) => this.hostagesExchanged(game)
    });

    // ROUND_5 → RESOLUTION
    this.addTransition({
      from: GameStatus.ROUND_5,
      to: GameStatus.RESOLUTION,
      trigger: 'ROUND_COMPLETE',
      guard: (game) => this.hostagesExchanged(game)
    });
  }

  /**
   * Add a transition
   */
  private addTransition(transition: StateTransition): void {
    this.transitions.push(transition);
  }

  /**
   * Check if a transition is possible
   */
  canTransition(game: Game, trigger: string): boolean {
    const validTransitions = this.findTransitions(game.state.public.status, trigger);

    if (validTransitions.length === 0) {
      return false;
    }

    return validTransitions.some((t) => !t.guard || t.guard(game));
  }

  /**
   * Execute a state transition
   */
  async transition(game: Game, trigger: string): Promise<Result<void>> {
    const currentStatus = game.state.public.status;
    const validTransitions = this.findTransitions(currentStatus, trigger);

    if (validTransitions.length === 0) {
      return {
        success: false,
        error: `Invalid transition: ${trigger} from ${currentStatus}`
      };
    }

    // Find first transition with satisfied guard
    const transition = validTransitions.find((t) => !t.guard || t.guard(game));

    if (!transition) {
      return {
        success: false,
        error: `Guard condition not met for ${trigger} from ${currentStatus}`
      };
    }

    // Execute action if present
    if (transition.action) {
      try {
        await transition.action(game);
      } catch (error) {
        return {
          success: false,
          error: `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    // Update state
    const previousStatus = game.state.public.status;
    game.state.public.status = transition.to;
    game.version++;
    game.updatedAt = Date.now();

    console.log(
      `State transition: ${previousStatus} → ${transition.to} (trigger: ${trigger})`
    );

    return { success: true };
  }

  /**
   * Find transitions matching current state and trigger
   */
  private findTransitions(
    currentStatus: GameStatus,
    trigger: string
  ): StateTransition[] {
    return this.transitions.filter((t) => {
      const fromMatches = Array.isArray(t.from)
        ? t.from.includes(currentStatus)
        : t.from === currentStatus;

      return fromMatches && t.trigger === trigger;
    });
  }

  /**
   * Get current round number from game status
   */
  getCurrentRoundNumber(status: GameStatus): number | null {
    const match = status.match(/ROUND_(\d)/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Check if hostages have been exchanged
   */
  private hostagesExchanged(game: Game): boolean {
    // Both rooms must have completed hostage exchange
    const roomA = game.state.rooms.ROOM_A;
    const roomB = game.state.rooms.ROOM_B;

    return (
      roomA.hostageCandidates.length === 0 &&
      roomB.hostageCandidates.length === 0 &&
      !roomA.hostagesLocked &&
      !roomB.hostagesLocked
    );
  }
}
