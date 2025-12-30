/**
 * Game Controller
 *
 * Orchestrates all game engines and handles player actions.
 * This is the main entry point for all game logic.
 */

import {
  ClientActionType,
  ServerEventType,
  Result,
  RoomId,
  CharacterId,
  GameStatus
} from '@two-rooms/shared';
import { Game, Player, createPlayer } from '../core/GameState';
import { gameStore } from '../services/GameStore';
import { eventBus } from '../services/EventBus';
import { characterLoader } from '../services/CharacterLoader';
import { StateMachine } from '../core/StateMachine';
import { ValidationEngine, ValidationPhase } from '../engines/ValidationEngine';
import { RoundEngine } from '../engines/RoundEngine';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class GameController {
  private stateMachine: StateMachine;
  private validationEngine: ValidationEngine;
  private roundEngine: RoundEngine;

  constructor() {
    this.stateMachine = new StateMachine();
    this.validationEngine = new ValidationEngine();
    this.roundEngine = new RoundEngine(this.stateMachine);
  }

  /**
   * Initialize - load characters
   */
  async initialize(): Promise<void> {
    await characterLoader.load();
    console.log('GameController initialized');
  }

  // ============================================================================
  // LOBBY ACTIONS
  // ============================================================================

  /**
   * Create a new game
   */
  createGame(hostName: string): Result<{ gameId: string; code: string; playerId: string }> {
    try {
      const game = gameStore.createGame(hostName);
      const host = Array.from(game.players.values())[0];

      // Broadcast game created
      eventBus.broadcast(
        game.id,
        ServerEventType.GAME_CREATED,
        {
          gameId: game.id,
          code: game.code,
          hostName
        },
        'PUBLIC'
      );

      return {
        success: true,
        data: {
          gameId: game.id,
          code: game.code,
          playerId: host.id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create game'
      };
    }
  }

  /**
   * Join a game
   */
  joinGame(
    code: string,
    playerName: string,
    connectionId: string
  ): Result<{ gameId: string; playerId: string }> {
    const game = gameStore.getByCode(code);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // Check if game is in lobby
    if (game.state.public.status !== GameStatus.LOBBY) {
      return { success: false, error: 'Game has already started' };
    }

    // Create player
    const playerId = uuidv4();
    const player = createPlayer(playerId, playerName, false, connectionId);
    game.players.set(playerId, player);

    // Update game
    gameStore.update(game);

    // Broadcast player joined
    eventBus.broadcast(
      game.id,
      ServerEventType.PLAYER_JOINED,
      {
        playerId,
        playerName,
        playerCount: game.players.size
      },
      'PUBLIC'
    );

    return {
      success: true,
      data: {
        gameId: game.id,
        playerId
      }
    };
  }

  /**
   * Leave a game
   */
  leaveGame(gameId: string, playerId: string): Result<void> {
    const game = gameStore.get(gameId);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player) {
      return { success: false, error: 'Player not found' };
    }

    // Remove player
    game.players.delete(playerId);

    // If host left, assign new host
    if (player.isHost && game.players.size > 0) {
      const newHost = Array.from(game.players.values())[0];
      newHost.isHost = true;
      game.state.private.hostId = newHost.id;
    }

    // Update game
    gameStore.update(game);

    // Broadcast player left
    eventBus.broadcast(
      game.id,
      ServerEventType.PLAYER_LEFT,
      {
        playerId,
        playerName: player.name,
        playerCount: game.players.size
      },
      'PUBLIC'
    );

    // If no players left, delete game
    if (game.players.size === 0) {
      gameStore.delete(gameId);
    }

    return { success: true };
  }

  /**
   * Lock room
   */
  async lockRoom(gameId: string, playerId: string): Promise<Result<void>> {
    const game = gameStore.get(gameId);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player || !player.isHost) {
      return { success: false, error: 'Only host can lock room' };
    }

    // Validate player count
    const validation = this.validationEngine.validate({
      game,
      phase: ValidationPhase.ROOM_LOCK
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors[0].message
      };
    }

    // Transition state to LOCKED
    const result = await this.stateMachine.transition(game, 'LOCK_ROOM');
    if (!result.success) {
      return result;
    }

    // Immediately transition to role selection
    const roleSelectionResult = await this.stateMachine.transition(game, 'START_ROLE_SELECTION');
    if (!roleSelectionResult.success) {
      return roleSelectionResult;
    }

    // Update game
    gameStore.update(game);

    // Broadcast room locked (clients will refetch and see ROLE_SELECTION status)
    eventBus.broadcast(
      game.id,
      ServerEventType.ROOM_LOCKED,
      {
        playerCount: game.players.size
      },
      'PUBLIC'
    );

    return { success: true };
  }

  // ============================================================================
  // ROLE SELECTION
  // ============================================================================

  /**
   * Select roles
   */
  selectRoles(
    gameId: string,
    playerId: string,
    roles: CharacterId[]
  ): Result<void> {
    const game = gameStore.get(gameId);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player || !player.isHost) {
      return { success: false, error: 'Only host can select roles' };
    }

    // Validate role configuration
    const validation = this.validationEngine.validateRoleConfiguration(
      roles,
      game.players.size,
      game.config.buryCard
    );

    if (!validation.valid) {
      return {
        success: false,
        error: validation.errors.map((e) => e.message).join('; '),
        context: { errors: validation.errors, warnings: validation.warnings }
      };
    }

    // Store selected roles
    game.config.selectedRoles = roles;
    gameStore.update(game);

    // Broadcast roles selected
    eventBus.broadcast(
      game.id,
      ServerEventType.ROLES_SELECTED,
      {
        roleCount: roles.length,
        hasWarnings: (validation.warnings?.length || 0) > 0
      },
      'PUBLIC'
    );

    return {
      success: true,
      context: { warnings: validation.warnings }
    };
  }

  /**
   * Confirm roles and distribute
   */
  async confirmRoles(gameId: string, playerId: string): Promise<Result<void>> {
    const game = gameStore.get(gameId);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player || !player.isHost) {
      return { success: false, error: 'Only host can confirm roles' };
    }

    // Transition to role distribution
    let result = await this.stateMachine.transition(game, 'CONFIRM_ROLES');
    if (!result.success) {
      return result;
    }

    // Distribute roles
    this.distributeRoles(game);

    // Transition to room assignment
    result = await this.stateMachine.transition(game, 'ROLES_DISTRIBUTED');
    if (!result.success) {
      return result;
    }

    // Assign players to rooms
    this.assignRooms(game);

    // Update game
    gameStore.update(game);

    return { success: true };
  }

  /**
   * Distribute roles to players (cryptographically random)
   */
  private distributeRoles(game: Game): void {
    const roles = [...game.config.selectedRoles];
    const players = Array.from(game.players.values());

    // Shuffle roles using crypto
    this.shuffleArray(roles);

    // Handle bury card
    if (game.config.buryCard && roles.length > players.length) {
      game.state.private.buriedCard = roles.pop()!;
    }

    // Assign roles to players
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const role = roles[i];

      player.currentRole = role;
      player.originalRole = role;
      game.state.private.roleAssignments[player.id] = role;

      // Send role to player privately
      const character = characterLoader.getCharacter(role);
      eventBus.broadcastToPlayer(
        game.id,
        player.id,
        ServerEventType.ROLE_ASSIGNED,
        {
          characterId: role,
          characterName: character?.name,
          characterDescription: character?.description,
          team: character?.team
        }
      );
    }

    console.log(`Distributed ${players.length} roles for game ${game.id}`);
  }

  /**
   * Assign players to rooms (even split)
   */
  private assignRooms(game: Game): void {
    const players = Array.from(game.players.values());

    // Shuffle players
    this.shuffleArray(players);

    // Split evenly
    const midpoint = Math.floor(players.length / 2);

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const room = i < midpoint ? RoomId.ROOM_A : RoomId.ROOM_B;

      player.currentRoom = room;
      game.state.public.roomAssignments[player.id] = room;
      game.state.rooms[room].players.push(player.id);
    }

    console.log(
      `Assigned ${game.state.rooms.ROOM_A.players.length} players to Room A, ${game.state.rooms.ROOM_B.players.length} to Room B`
    );
  }

  /**
   * Start game
   */
  async startGame(gameId: string, playerId: string): Promise<Result<void>> {
    const game = gameStore.get(gameId);

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player || !player.isHost) {
      return { success: false, error: 'Only host can start game' };
    }

    // Transition to round 1
    const result = await this.stateMachine.transition(game, 'START_GAME');
    if (!result.success) {
      return result;
    }

    // Start round 1
    this.roundEngine.startRound(game, 1);

    // Update game
    gameStore.update(game);

    return { success: true };
  }

  // ============================================================================
  // ROUND ACTIONS
  // ============================================================================

  /**
   * Nominate leader (vote for a candidate)
   */
  nominateLeader(
    gameId: string,
    playerId: string,
    roomId: RoomId,
    candidateId: string
  ): Result<void> {
    const game = gameStore.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const result = this.roundEngine.nominateLeader(game, roomId, candidateId, playerId);
    if (result.success) {
      gameStore.update(game);
    }

    return result;
  }

  /**
   * Initiate new leader vote (for subsequent rounds)
   */
  initiateNewLeaderVote(
    gameId: string,
    playerId: string,
    roomId: RoomId
  ): Result<void> {
    const game = gameStore.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const result = this.roundEngine.initiateNewLeaderVote(game, roomId, playerId);
    if (result.success) {
      gameStore.update(game);
    }

    return result;
  }

  /**
   * Vote to usurp leader
   */
  voteUsurp(
    gameId: string,
    playerId: string,
    roomId: RoomId,
    candidateId: string
  ): Result<void> {
    const game = gameStore.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const result = this.roundEngine.voteUsurp(game, roomId, playerId, candidateId);
    if (result.success) {
      gameStore.update(game);
    }

    return result;
  }

  /**
   * Select hostage
   */
  selectHostage(
    gameId: string,
    playerId: string,
    roomId: RoomId,
    hostageId: string
  ): Result<void> {
    const game = gameStore.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player || !player.isLeader) {
      return { success: false, error: 'Only leader can select hostages' };
    }

    const result = this.roundEngine.selectHostage(game, roomId, hostageId);
    if (result.success) {
      gameStore.update(game);
    }

    return result;
  }

  /**
   * Lock hostages
   */
  lockHostages(gameId: string, playerId: string, roomId: RoomId): Result<void> {
    const game = gameStore.get(gameId);
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    const player = game.players.get(playerId);
    if (!player || !player.isLeader) {
      return { success: false, error: 'Only leader can lock hostages' };
    }

    const result = this.roundEngine.lockHostages(game, roomId);
    if (result.success) {
      gameStore.update(game);
    }

    return result;
  }

  // ============================================================================
  // UTILITY
  // ============================================================================

  /**
   * Get game state for a player (scoped view)
   */
  getPlayerGameView(gameId: string, playerId: string): any {
    const game = gameStore.get(gameId);
    if (!game) {
      return null;
    }

    const player = game.players.get(playerId);
    if (!player) {
      return null;
    }

    // Get character info if role assigned
    let roleName: string | undefined;
    let teamColor: string | undefined;
    let characterDefinition;
    if (player.currentRole) {
      const character = characterLoader.getCharacter(player.currentRole);
      if (character) {
        roleName = character.name;
        teamColor = character.team;
        characterDefinition = character;
      }
    }

    // Get all character definitions for roles in the current game
    const gameRoles = game.config.selectedRoles
      .map(roleId => characterLoader.getCharacter(roleId))
      .filter(char => char !== undefined);

    // Convert players Map to array of PublicPlayerInfo
    const playersArray = Array.from(game.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      connectionStatus: p.connectionStatus,
      isLeader: p.isLeader,
      isAlive: p.alive
    }));

    return {
      playerId: playerId,
      public: {
        ...game.state.public,
        players: playersArray,
        config: game.config,
        rooms: game.state.rooms
      },
      playerPrivate: {
        playerId: playerId,
        currentRole: player.currentRole,
        originalRole: player.originalRole,
        conditions: player.conditions,
        collectedCards: [],
        knownInformation: player.knownInformation,
        role: roleName,
        team: teamColor,
        characterDefinition: characterDefinition,
        gameRoles: gameRoles
      }
    };
  }

  /**
   * Cryptographic shuffle using Fisher-Yates
   */
  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const randomBytes = crypto.randomBytes(4);
      const randomValue = randomBytes.readUInt32BE(0);
      const j = randomValue % (i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
