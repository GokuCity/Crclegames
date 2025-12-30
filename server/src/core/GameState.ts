/**
 * Core Game State Models
 *
 * These are the server-side data structures that represent the complete game state.
 * The server owns ALL state - clients only receive scoped views.
 */

import {
  GameStatus,
  RoomId,
  ConnectionStatus,
  CharacterId,
  CharacterCard,
  Condition,
  KnownInfo,
  GameConfig,
  PublicPlayerInfo,
  RoomState,
  TimerState,
  RoundEvent
} from '@two-rooms/shared';

// ============================================================================
// PLAYER (Server-side full state)
// ============================================================================

export interface Player {
  // Identity
  id: string;
  name: string;
  isHost: boolean;

  // Connection
  connectionStatus: ConnectionStatus;
  connectionId: string | null;
  lastSeen: number;
  lastSeenVersion: number; // For event replay on reconnect

  // Game state
  currentRole: CharacterId | null;
  originalRole: CharacterId | null;
  currentRoom: RoomId | null;
  isLeader: boolean;
  canBeHostage: boolean;
  alive: boolean;

  // Collected data
  conditions: Condition[];
  collectedCards: CharacterCard[];
  knownInformation: KnownInfo[];

  // Tracking for win conditions
  wasSentAsHostage: boolean;
  usurpedLeadersCount: number;
}

// ============================================================================
// GAME STATE (Partitioned)
// ============================================================================

export interface PublicState {
  gameId: string;
  code: string;
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  roomAssignments: Record<string, RoomId>;
  leaders: {
    [RoomId.ROOM_A]: string | null;
    [RoomId.ROOM_B]: string | null;
  };
  timer: TimerState;
  paused: boolean;
  pauseReason: string | null;
  parlayActive: boolean;
}

export interface PrivateState {
  // Role assignments (NEVER sent to clients)
  roleAssignments: Record<string, CharacterId>;

  // Deck configuration
  deckConfiguration: CharacterId[];
  buriedCard: CharacterId | null;

  // Host
  hostId: string;

  // Randomization seed for reproducibility
  secretSeed: string;

  // Tracking for win conditions
  usurpations: Record<number, string[]>; // roundNumber -> usurperIds[]
  cardShares: Array<{ player1: string; player2: string; round: number }>;
}

export interface GameState {
  public: PublicState;
  rooms: {
    [RoomId.ROOM_A]: RoomState;
    [RoomId.ROOM_B]: RoomState;
  };
  private: PrivateState;
}

// ============================================================================
// GAME (Complete game instance)
// ============================================================================

export interface Game {
  // Metadata
  id: string;
  code: string;
  createdAt: number;
  updatedAt: number;
  version: number; // For optimistic locking

  // Configuration
  config: GameConfig;

  // Players
  players: Map<string, Player>;

  // State
  state: GameState;

  // Event log (for reconnection and replay)
  events: GameEvent[];
}

// ============================================================================
// EVENTS
// ============================================================================

export type EventScope = 'PUBLIC' | RoomId | { playerId: string };

export interface GameEvent {
  eventId: string;
  sequenceNumber: number;
  type: string;
  scope: EventScope;
  payload: any;
  timestamp: number;
}

// ============================================================================
// ROUND
// ============================================================================

export interface Round {
  number: 1 | 2 | 3 | 4 | 5;
  duration: number;
  startTime: number;
  endTime: number | null;
  hostageCount: number;
  events: RoundEvent[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new player
 */
export function createPlayer(
  id: string,
  name: string,
  isHost: boolean,
  connectionId: string
): Player {
  return {
    id,
    name,
    isHost,
    connectionStatus: ConnectionStatus.CONNECTED,
    connectionId,
    lastSeen: Date.now(),
    lastSeenVersion: 0,
    currentRole: null,
    originalRole: null,
    currentRoom: null,
    isLeader: false,
    canBeHostage: true,
    alive: true,
    conditions: [],
    collectedCards: [],
    knownInformation: [],
    wasSentAsHostage: false,
    usurpedLeadersCount: 0
  };
}

/**
 * Create initial game state
 */
export function createInitialGameState(
  gameId: string,
  code: string,
  hostId: string
): GameState {
  return {
    public: {
      gameId,
      code,
      status: GameStatus.LOBBY,
      currentRound: 0,
      totalRounds: 3,
      roomAssignments: {},
      leaders: {
        [RoomId.ROOM_A]: null,
        [RoomId.ROOM_B]: null
      },
      timer: {
        duration: 0,
        remaining: 0,
        state: 'STOPPED'
      },
      paused: false,
      pauseReason: null,
      parlayActive: false
    },
    rooms: {
      [RoomId.ROOM_A]: {
        roomId: RoomId.ROOM_A,
        players: [],
        leaderId: null,
        leaderVotes: {},
        leaderVotingActive: false,
        leaderVotingTieCount: 0,
        hostageCandidates: [],
        hostagesLocked: false,
        parlayComplete: false
      },
      [RoomId.ROOM_B]: {
        roomId: RoomId.ROOM_B,
        players: [],
        leaderId: null,
        leaderVotes: {},
        leaderVotingActive: false,
        leaderVotingTieCount: 0,
        hostageCandidates: [],
        hostagesLocked: false,
        parlayComplete: false
      }
    },
    private: {
      roleAssignments: {},
      deckConfiguration: [],
      buriedCard: null,
      hostId,
      secretSeed: generateSeed(),
      usurpations: {},
      cardShares: []
    }
  };
}

/**
 * Convert player to public info
 */
export function toPublicPlayerInfo(player: Player): PublicPlayerInfo {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    connectionStatus: player.connectionStatus,
    currentRoom: player.currentRoom,
    isLeader: player.isLeader
  };
}

/**
 * Generate cryptographically secure seed
 */
function generateSeed(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Calculate hostage count based on player count and round number
 * (from rulebook)
 */
export function calculateHostageCount(
  playerCount: number,
  roundNumber: number
): number {
  if (playerCount >= 6 && playerCount <= 10) {
    return 1; // All rounds
  } else if (playerCount >= 11 && playerCount <= 21) {
    return roundNumber === 1 ? 2 : 1;
  } else if (playerCount >= 22) {
    if (roundNumber === 1) return 3;
    if (roundNumber === 2) return 2;
    return 1;
  }
  return 1; // Default
}
