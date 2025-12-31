/**
 * Shared Types for Two Rooms and a Boom
 *
 * These types are used by both client and server to ensure type safety
 * across the entire application.
 */

// ============================================================================
// GAME STATUS & STATES
// ============================================================================

export enum GameStatus {
  LOBBY = 'LOBBY',
  LOCKED = 'LOCKED',
  ROLE_SELECTION = 'ROLE_SELECTION',
  ROLE_DISTRIBUTION = 'ROLE_DISTRIBUTION',
  ROOM_ASSIGNMENT = 'ROOM_ASSIGNMENT',
  ROUND_1 = 'ROUND_1',
  ROUND_2 = 'ROUND_2',
  ROUND_3 = 'ROUND_3',
  ROUND_4 = 'ROUND_4',
  ROUND_5 = 'ROUND_5',
  RESOLUTION = 'RESOLUTION',
  FINISHED = 'FINISHED'
}

export enum RoomId {
  ROOM_A = 'ROOM_A',
  ROOM_B = 'ROOM_B'
}

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING'
}

// ============================================================================
// TEAMS & CHARACTERS
// ============================================================================

export enum TeamColor {
  BLUE = 'BLUE',
  RED = 'RED',
  GREY = 'GREY',
  GREEN = 'GREEN',
  PURPLE = 'PURPLE',
  BLACK = 'BLACK',
  PINK = 'PINK'
}

export enum CharacterClass {
  PRIMARY = 'PRIMARY',
  BACKUP = 'BACKUP',
  REGULAR = 'REGULAR'
}

export type CharacterId = string;

export interface CharacterCard {
  characterId: CharacterId;
  instanceId: string;
}

// ============================================================================
// ABILITIES
// ============================================================================

export enum AbilityTrigger {
  // Timing triggers
  GAME_START = 'GAME_START',
  ROUND_START = 'ROUND_START',
  ROUND_END = 'ROUND_END',
  GAME_END = 'GAME_END',

  // Action triggers
  ON_CARD_SHARE_INITIATED = 'ON_CARD_SHARE_INITIATED',
  ON_CARD_SHARE_RECEIVED = 'ON_CARD_SHARE_RECEIVED',
  ON_COLOR_SHARE_INITIATED = 'ON_COLOR_SHARE_INITIATED',
  ON_COLOR_SHARE_RECEIVED = 'ON_COLOR_SHARE_RECEIVED',
  ON_PRIVATE_REVEAL = 'ON_PRIVATE_REVEAL',
  ON_BECOME_HOSTAGE = 'ON_BECOME_HOSTAGE',
  ON_VOTE_CAST = 'ON_VOTE_CAST',

  // Manual triggers
  MANUAL = 'MANUAL'
}

export enum AbilityEffect {
  // Information effects
  FORCE_CARD_SHARE = 'FORCE_CARD_SHARE',
  FORCE_COLOR_SHARE = 'FORCE_COLOR_SHARE',
  FORCE_PRIVATE_REVEAL = 'FORCE_PRIVATE_REVEAL',
  STEAL_CARD = 'STEAL_CARD',
  SWAP_CARD = 'SWAP_CARD',

  // Condition effects
  APPLY_CONDITION = 'APPLY_CONDITION',
  REMOVE_CONDITION = 'REMOVE_CONDITION',
  REMOVE_ALL_CONDITIONS = 'REMOVE_ALL_CONDITIONS',

  // Movement effects
  FORCE_HOSTAGE = 'FORCE_HOSTAGE',
  PREVENT_HOSTAGE = 'PREVENT_HOSTAGE',
  FORCE_ROOM_CHANGE = 'FORCE_ROOM_CHANGE',
  PREVENT_ROOM_CHANGE = 'PREVENT_ROOM_CHANGE',

  // Team effects
  CHANGE_TEAM = 'CHANGE_TEAM',

  // Game effects
  END_ROUND_EARLY = 'END_ROUND_EARLY',
  INSTANT_WIN = 'INSTANT_WIN',
  INSTANT_LOSE = 'INSTANT_LOSE',

  // Special
  REMOVE_FROM_GAME = 'REMOVE_FROM_GAME',
  CUSTOM = 'CUSTOM'
}

export enum TargetingType {
  SELF = 'SELF',
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  MULTIPLE_PLAYERS = 'MULTIPLE_PLAYERS',
  ALL_IN_ROOM = 'ALL_IN_ROOM',
  ALL_PLAYERS = 'ALL_PLAYERS',
  CARD_SHARE_PARTNER = 'CARD_SHARE_PARTNER'
}

export interface TargetFilter {
  team?: TeamColor[];
  inSameRoom?: boolean;
  hasCondition?: ConditionType[];
  isLeader?: boolean;
}

export interface TargetingRule {
  type: TargetingType;
  count?: number;
  filter?: TargetFilter;
}

export interface AbilityCondition {
  type: 'HAS_CONDITION' | 'IN_ROOM' | 'IS_LEADER' | 'ROUND_NUMBER' | 'CUSTOM';
  parameters: Record<string, any>;
}

export interface Ability {
  id: string;
  name: string;
  trigger: AbilityTrigger;
  effect: AbilityEffect;
  targeting: TargetingRule;
  usageLimit?: {
    count: number;
    per: 'GAME' | 'ROUND';
  };
  conditions?: AbilityCondition[];
  parameters: Record<string, any>;
  priority: number;
}

// ============================================================================
// CONDITIONS
// ============================================================================

export enum ConditionType {
  HONEST = 'HONEST',
  ATTACHED = 'ATTACHED',
  TRAITOR = 'TRAITOR',
  CURSED = 'CURSED',
  SILENCED = 'SILENCED',
  INFECTED = 'INFECTED',
  TOAST = 'TOAST',
  IN_LOVE = 'IN_LOVE',
  CULT = 'CULT'
}

export type ActionType =
  | 'VOTE'
  | 'REVEAL_CARD'
  | 'COLOR_SHARE'
  | 'CARD_SHARE'
  | 'MOVE_ROOMS'
  | 'SPEAK';

export interface Condition {
  type: ConditionType;
  appliedBy: string;
  appliedAt: number;
  parameters?: Record<string, any>;
  preventActions?: ActionType[];
  enforceActions?: ActionType[];
}

// ============================================================================
// WIN CONDITIONS
// ============================================================================

export enum WinConditionType {
  TEAM_WINS = 'TEAM_WINS',
  WITH_CHARACTERS = 'WITH_CHARACTERS',
  NOT_WITH_CHARACTERS = 'NOT_WITH_CHARACTERS',
  CARD_SHARED_WITH = 'CARD_SHARED_WITH',
  NOT_CARD_SHARED_WITH = 'NOT_CARD_SHARED_WITH',
  IS_LEADER = 'IS_LEADER',
  SURVIVED = 'SURVIVED',
  NEVER_SENT_AS_HOSTAGE = 'NEVER_SENT_AS_HOSTAGE',
  CORRECT_GUESS = 'CORRECT_GUESS',
  MOST_USURP_VOTES = 'MOST_USURP_VOTES',
  CUSTOM = 'CUSTOM'
}

export interface WinCondition {
  type: WinConditionType;
  priority: number;
  overridesTeam: boolean;
  parameters: Record<string, any>;
  evaluator?: string;
}

// ============================================================================
// CHARACTER DEFINITIONS
// ============================================================================

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  team: TeamColor;
  class: CharacterClass;
  description: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  requires?: CharacterId[];
  mutuallyExclusive?: CharacterId[];
  abilities: Ability[];
  winConditions?: WinCondition[];
}

// ============================================================================
// GAME CONFIGURATION
// ============================================================================

export interface GameConfig {
  totalRounds: 3 | 5;
  roundDurations: number[];
  enableAdvancedCharacters: boolean;
  enableConditions: boolean;
  buryCard: boolean;
  selectedRoles: CharacterId[];
}

// ============================================================================
// PLAYER
// ============================================================================

export interface KnownInfo {
  type: 'CARD_SHARE' | 'COLOR_SHARE' | 'PRIVATE_REVEAL' | 'PUBLIC_REVEAL';
  targetPlayerId: string;
  information: CharacterCard | TeamColor;
  timestamp: number;
  source: string;
}

export interface PublicPlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  connectionStatus: ConnectionStatus;
  currentRoom: RoomId | null;
  isLeader: boolean;
}

// ============================================================================
// ROUND
// ============================================================================

export enum RoundStatus {
  PENDING = 'PENDING',
  LEADER_SELECTION = 'LEADER_SELECTION',
  ACTIVE = 'ACTIVE',
  HOSTAGE_SELECTION = 'HOSTAGE_SELECTION',
  PARLAY = 'PARLAY',
  HOSTAGE_EXCHANGE = 'HOSTAGE_EXCHANGE',
  COMPLETE = 'COMPLETE'
}

export enum RoundEventType {
  LEADER_NOMINATED = 'LEADER_NOMINATED',
  LEADER_ELECTED = 'LEADER_ELECTED',
  LEADER_ABDICATED = 'LEADER_ABDICATED',
  LEADER_USURPED = 'LEADER_USURPED',
  VOTE_CAST = 'VOTE_CAST',
  HOSTAGE_SELECTED = 'HOSTAGE_SELECTED',
  HOSTAGE_LOCKED = 'HOSTAGE_LOCKED',
  PARLAY_STARTED = 'PARLAY_STARTED',
  PARLAY_ENDED = 'PARLAY_ENDED',
  HOSTAGE_EXCHANGED = 'HOSTAGE_EXCHANGED',
  ABILITY_ACTIVATED = 'ABILITY_ACTIVATED',
  CARD_SHARED = 'CARD_SHARED',
  COLOR_SHARED = 'COLOR_SHARED',
  ROUND_ENDED_EARLY = 'ROUND_ENDED_EARLY'
}

export interface RoundEvent {
  type: RoundEventType;
  timestamp: number;
  playerId?: string;
  roomId?: RoomId;
  data: any;
}

// ============================================================================
// GAME STATE (Public facing)
// ============================================================================

export interface TimerState {
  duration: number;
  remaining: number;
  state: 'RUNNING' | 'PAUSED' | 'STOPPED';
}

export interface PublicGameState {
  gameId: string;
  code: string;
  status: GameStatus;
  players: PublicPlayerInfo[];
  currentRound: number;
  totalRounds: number;
  roomAssignments: Record<string, RoomId>;
  leaders: {
    [RoomId.ROOM_A]: string | null;
    [RoomId.ROOM_B]: string | null;
  };
  rooms: {
    [RoomId.ROOM_A]: RoomState;
    [RoomId.ROOM_B]: RoomState;
  };
  timer: TimerState;
  paused: boolean;
  pauseReason: string | null;
  config: GameConfig;
}

export interface RoomState {
  roomId: RoomId;
  players: string[];
  leaderId: string | null;
  leaderVotes: Record<string, string>;
  leaderVotingActive: boolean;
  leaderVotingTieCount: number;
  hostageCandidates: string[];
  hostagesLocked: boolean;
  parlayComplete: boolean;
}

export interface PlayerPrivateState {
  playerId?: string; // Added for client-side tracking
  currentRole: CharacterCard | null;
  originalRole: CharacterCard | null;
  conditions: Condition[];
  collectedCards: CharacterCard[];
  knownInformation: KnownInfo[];
  role?: string; // Character name for easier access
  team?: TeamColor; // Team color for easier access
  characterDefinition?: CharacterDefinition; // Full character details for UI display
  gameRoles?: CharacterDefinition[]; // All roles in the current game
}

/**
 * Player's view of the game state
 * (what the client receives from the server)
 */
export interface PlayerGameView {
  playerId: string;
  public: PublicGameState;
  playerPrivate: PlayerPrivateState;
}

// ============================================================================
// EVENTS (Client <-> Server Communication)
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
// ACTIONS (Client -> Server)
// ============================================================================

export enum ClientActionType {
  // Lobby actions
  CREATE_GAME = 'CREATE_GAME',
  JOIN_GAME = 'JOIN_GAME',
  LEAVE_GAME = 'LEAVE_GAME',
  LOCK_ROOM = 'LOCK_ROOM',
  UNLOCK_ROOM = 'UNLOCK_ROOM',

  // Role selection
  SELECT_ROLES = 'SELECT_ROLES',
  SET_ROUNDS = 'SET_ROUNDS',
  CONFIRM_ROLES = 'CONFIRM_ROLES',

  // Game actions
  START_GAME = 'START_GAME',
  NOMINATE_LEADER = 'NOMINATE_LEADER',
  INITIATE_NEW_LEADER_VOTE = 'INITIATE_NEW_LEADER_VOTE',
  VOTE_USURP = 'VOTE_USURP',
  ABDICATE = 'ABDICATE',
  SELECT_HOSTAGE = 'SELECT_HOSTAGE',
  LOCK_HOSTAGES = 'LOCK_HOSTAGES',

  // Card sharing
  CARD_SHARE = 'CARD_SHARE',
  COLOR_SHARE = 'COLOR_SHARE',
  PRIVATE_REVEAL = 'PRIVATE_REVEAL',
  PUBLIC_REVEAL = 'PUBLIC_REVEAL',

  // Abilities
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY'
}

export interface ClientAction {
  type: ClientActionType;
  playerId: string;
  payload: any;
  timestamp: number;
  signature?: string;
}

// ============================================================================
// SERVER EVENTS (Server -> Client)
// ============================================================================

export enum ServerEventType {
  // Connection events
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',

  // Game state events
  GAME_CREATED = 'GAME_CREATED',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED = 'PLAYER_RECONNECTED',
  PLAYER_REMOVED = 'PLAYER_REMOVED',
  ROOM_LOCKED = 'ROOM_LOCKED',
  ROOM_UNLOCKED = 'ROOM_UNLOCKED',

  // Role selection
  ROLES_SELECTED = 'ROLES_SELECTED',
  ROLE_ASSIGNED = 'ROLE_ASSIGNED',
  GAME_CONFIG_UPDATED = 'GAME_CONFIG_UPDATED',

  // Round events
  ROUND_STARTED = 'ROUND_STARTED',
  ROUND_ENDED = 'ROUND_ENDED',
  TIMER_UPDATE = 'TIMER_UPDATE',

  // Leader events
  LEADER_NOMINATED = 'LEADER_NOMINATED',
  LEADER_ELECTED = 'LEADER_ELECTED',
  LEADER_USURPED = 'LEADER_USURPED',
  LEADER_ABDICATED = 'LEADER_ABDICATED',
  LEADER_DISCONNECTED = 'LEADER_DISCONNECTED',
  VOTE_CAST = 'VOTE_CAST',

  // Hostage events
  HOSTAGE_SELECTED = 'HOSTAGE_SELECTED',
  HOSTAGES_LOCKED = 'HOSTAGES_LOCKED',
  PARLAY_STARTED = 'PARLAY_STARTED',
  PARLAY_ENDED = 'PARLAY_ENDED',
  HOSTAGES_EXCHANGED = 'HOSTAGES_EXCHANGED',

  // Ability events
  ABILITY_ACTIVATED = 'ABILITY_ACTIVATED',
  CONDITION_APPLIED = 'CONDITION_APPLIED',
  CONDITION_REMOVED = 'CONDITION_REMOVED',

  // Game flow
  GAME_PAUSED = 'GAME_PAUSED',
  GAME_RESUMED = 'GAME_RESUMED',
  GAME_FINISHED = 'GAME_FINISHED',

  // Sync events
  STATE_SYNC = 'STATE_SYNC',
  DESYNC_DETECTED = 'DESYNC_DETECTED'
}

export interface ServerEvent {
  type: ServerEventType;
  payload: any;
  timestamp: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationError {
  code: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  context?: Record<string, any>;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

// ============================================================================
// RESULTS
// ============================================================================

export interface Result<T> {
  success: boolean;
  data?: T;
  error?: string;
  context?: Record<string, any>;
}
