/**
 * Game Client
 *
 * High-level game state management and API calls.
 */

import {
  ClientAction,
  ClientActionType,
  ServerEvent,
  CharacterId,
  RoomId,
  PlayerGameView
} from '@two-rooms/shared';
import { wsClient } from './WebSocketClient';

export interface CreateGameResponse {
  gameId: string;
  code: string;
  playerId: string;
  playerName: string;
}

export interface JoinGameResponse {
  gameId: string;
  code: string;
  playerId: string;
  playerName: string;
}

export class GameClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  /**
   * Create a new game
   */
  async createGame(hostName: string): Promise<CreateGameResponse> {
    const response = await fetch(`${this.baseURL}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create game');
    }

    return response.json();
  }

  /**
   * Join an existing game
   */
  async joinGame(code: string, playerName: string): Promise<JoinGameResponse> {
    const response = await fetch(`${this.baseURL}/api/games/${code}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to join game');
    }

    return response.json();
  }

  /**
   * Get player's game view
   */
  async getGameView(gameId: string, playerId: string): Promise<PlayerGameView> {
    console.log(`Fetching game view for game ${gameId}, player ${playerId}`);
    const url = `${this.baseURL}/api/games/${gameId}/players/${playerId}`;
    console.log(`URL: ${url}`);

    const response = await fetch(url);

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      const error = await response.json();
      console.error('Get game view error:', error);
      throw new Error(error.error || 'Failed to get game view');
    }

    const data = await response.json();
    console.log('Game view data:', data);
    return data;
  }

  /**
   * Connect to WebSocket and subscribe to events
   */
  async connectWebSocket(
    gameId: string,
    playerId: string,
    eventHandler: (event: ServerEvent) => void
  ): Promise<void> {
    wsClient.onEvent(eventHandler);
    await wsClient.connect(gameId, playerId);
  }

  /**
   * Lock the room
   */
  lockRoom(playerId: string): void {
    this.sendAction({
      type: ClientActionType.LOCK_ROOM,
      playerId,
      payload: {}
    });
  }

  /**
   * Select roles
   */
  selectRoles(playerId: string, roles: CharacterId[]): void {
    this.sendAction({
      type: ClientActionType.SELECT_ROLES,
      playerId,
      payload: { roles }
    });
  }

  /**
   * Set rounds
   */
  setRounds(playerId: string, totalRounds: 3 | 5): void {
    console.log('🔍 ClientActionType.SET_ROUNDS =', ClientActionType.SET_ROUNDS);
    console.log('🔍 Full ClientActionType enum:', ClientActionType);
    this.sendAction({
      type: ClientActionType.SET_ROUNDS,
      playerId,
      payload: { totalRounds }
    });
  }

  /**
   * Confirm roles
   */
  confirmRoles(playerId: string): void {
    this.sendAction({
      type: ClientActionType.CONFIRM_ROLES,
      playerId,
      payload: {}
    });
  }

  /**
   * Start game
   */
  startGame(playerId: string): void {
    this.sendAction({
      type: ClientActionType.START_GAME,
      playerId,
      payload: {}
    });
  }

  /**
   * Nominate leader
   */
  nominateLeader(playerId: string, roomId: RoomId, candidateId: string): void {
    console.log('GameClient.nominateLeader called:', { playerId, roomId, candidateId });
    this.sendAction({
      type: ClientActionType.NOMINATE_LEADER,
      playerId,
      payload: { roomId, candidateId }
    });
  }

  /**
   * Initiate new leader vote
   */
  initiateNewLeaderVote(playerId: string, roomId: RoomId): void {
    this.sendAction({
      type: ClientActionType.INITIATE_NEW_LEADER_VOTE,
      playerId,
      payload: { roomId }
    });
  }

  /**
   * Vote to usurp leader
   */
  voteUsurp(playerId: string, roomId: RoomId, candidateId: string): void {
    this.sendAction({
      type: ClientActionType.VOTE_USURP,
      playerId,
      payload: { roomId, candidateId }
    });
  }

  /**
   * Select hostage
   */
  selectHostage(playerId: string, roomId: RoomId, targetPlayerId: string): void {
    this.sendAction({
      type: ClientActionType.SELECT_HOSTAGE,
      playerId,
      payload: { roomId, targetPlayerId }
    });
  }

  /**
   * Lock hostages
   */
  lockHostages(playerId: string, roomId: RoomId): void {
    this.sendAction({
      type: ClientActionType.LOCK_HOSTAGES,
      playerId,
      payload: { roomId }
    });
  }

  /**
   * Send action via WebSocket
   */
  private sendAction(action: Omit<ClientAction, 'timestamp'>): void {
    wsClient.send({
      ...action,
      timestamp: Date.now()
    });
  }

  /**
   * Disconnect from game
   */
  disconnect(): void {
    wsClient.disconnect();
  }
}

// Singleton instance
export const gameClient = new GameClient();
