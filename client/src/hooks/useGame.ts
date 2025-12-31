/**
 * useGame Hook
 *
 * React hook for managing game state and actions.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PlayerGameView,
  ServerEvent,
  ServerEventType,
  CharacterId,
  RoomId
} from '@two-rooms/shared';
import { gameClient } from '../services/GameClient';

export interface UseGameResult {
  gameView: PlayerGameView | null;
  isConnected: boolean;
  error: string | null;
  createGame: (hostName: string) => Promise<void>;
  joinGame: (code: string, playerName: string) => Promise<void>;
  lockRoom: () => void;
  selectRoles: (roles: CharacterId[]) => void;
  setRounds: (totalRounds: 3 | 5) => void;
  confirmRoles: () => void;
  startGame: () => void;
  nominateLeader: (roomId: RoomId, candidateId: string) => void;
  initiateNewLeaderVote: (roomId: RoomId) => void;
  voteUsurp: (roomId: RoomId, candidateId: string) => void;
  selectHostage: (roomId: RoomId, targetPlayerId: string) => void;
  lockHostages: (roomId: RoomId) => void;
  disconnect: () => void;
}

export function useGame(): UseGameResult {
  const [gameView, setGameView] = useState<PlayerGameView | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);

  // Use refs to always have current values in callbacks
  const playerIdRef = useRef<string | null>(null);
  const gameIdRef = useRef<string | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    gameIdRef.current = gameId;
  }, [gameId]);

  /**
   * Handle server events
   */
  const handleEvent = useCallback((event: ServerEvent) => {
    console.log('🔔 Received event:', event.type, event.payload);
    console.log('Current gameId:', gameIdRef.current, 'playerId:', playerIdRef.current);

    switch (event.type) {
      case ServerEventType.PLAYER_JOINED:
      case ServerEventType.PLAYER_LEFT:
      case ServerEventType.ROOM_LOCKED:
      case ServerEventType.ROLES_SELECTED:
      case ServerEventType.ROLE_ASSIGNED:
        // For events that change game state significantly, refetch the full game view
        if (gameIdRef.current && playerIdRef.current) {
          console.log('Refetching game view after event:', event.type);
          gameClient.getGameView(gameIdRef.current, playerIdRef.current).then((view) => {
            console.log('Updated game view:', view);
            setGameView(view);
          }).catch((err) => {
            console.error('Failed to refetch game view:', err);
          });
        } else {
          console.warn('Cannot refetch: gameId or playerId is null');
        }
        break;

      case ServerEventType.ROUND_STARTED:
      case ServerEventType.TIMER_UPDATE:
      case ServerEventType.VOTE_CAST:
      case ServerEventType.LEADER_ELECTED:
      case ServerEventType.LEADER_USURPED:
      case ServerEventType.HOSTAGE_SELECTED:
      case ServerEventType.HOSTAGES_LOCKED:
      case ServerEventType.PARLAY_STARTED:
      case ServerEventType.PARLAY_ENDED:
      case ServerEventType.HOSTAGES_EXCHANGED:
      case ServerEventType.ROUND_ENDED:
      case ServerEventType.GAME_FINISHED:
      case ServerEventType.GAME_PAUSED:
      case ServerEventType.GAME_RESUMED:
        // For smaller updates, we can merge (though refetching is safer)
        if (gameIdRef.current && playerIdRef.current) {
          gameClient.getGameView(gameIdRef.current, playerIdRef.current).then((view) => {
            if (event.type === ServerEventType.TIMER_UPDATE) {
              console.log('⏱️ TIMER_UPDATE: Setting game view with timer:', view.public.timer);
            }
            setGameView(view);
          }).catch((err) => {
            console.error('Failed to refetch game view:', err);
          });
        }
        break;

      case 'ERROR':
        setError(event.payload.message);
        setTimeout(() => setError(null), 5000);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }
  }, []); // No dependencies - uses refs instead

  /**
   * Create a new game
   */
  const createGame = useCallback(async (hostName: string) => {
    try {
      setError(null);
      const response = await gameClient.createGame(hostName);

      setPlayerId(response.playerId);
      setGameId(response.gameId);

      // Connect WebSocket
      await gameClient.connectWebSocket(response.gameId, response.playerId, handleEvent);
      setIsConnected(true);

      // Fetch initial game view
      const view = await gameClient.getGameView(response.gameId, response.playerId);
      setGameView(view);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      throw err;
    }
  }, [handleEvent]);

  /**
   * Join an existing game
   */
  const joinGame = useCallback(
    async (code: string, playerName: string) => {
      try {
        setError(null);
        const response = await gameClient.joinGame(code, playerName);

        setPlayerId(response.playerId);
        setGameId(response.gameId);

        // Connect WebSocket
        await gameClient.connectWebSocket(response.gameId, response.playerId, handleEvent);
        setIsConnected(true);

        // Fetch initial game view
        const view = await gameClient.getGameView(response.gameId, response.playerId);
        setGameView(view);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join game');
        throw err;
      }
    },
    [handleEvent]
  );

  /**
   * Lock room
   */
  const lockRoom = useCallback(() => {
    if (!playerId) return;
    gameClient.lockRoom(playerId);
  }, [playerId]);

  /**
   * Select roles
   */
  const selectRoles = useCallback(
    (roles: CharacterId[]) => {
      if (!playerId) return;
      gameClient.selectRoles(playerId, roles);
    },
    [playerId]
  );

  /**
   * Set rounds
   */
  const setRounds = useCallback(
    (totalRounds: 3 | 5) => {
      if (!playerId) return;
      gameClient.setRounds(playerId, totalRounds);
    },
    [playerId]
  );

  /**
   * Confirm roles
   */
  const confirmRoles = useCallback(() => {
    if (!playerId) return;
    gameClient.confirmRoles(playerId);
  }, [playerId]);

  /**
   * Start game
   */
  const startGame = useCallback(() => {
    if (!playerId) return;
    gameClient.startGame(playerId);
  }, [playerId]);

  /**
   * Nominate leader
   */
  const nominateLeader = useCallback(
    (roomId: RoomId, candidateId: string) => {
      if (!playerId) return;
      gameClient.nominateLeader(playerId, roomId, candidateId);
    },
    [playerId]
  );

  /**
   * Initiate new leader vote
   */
  const initiateNewLeaderVote = useCallback(
    (roomId: RoomId) => {
      if (!playerId) return;
      gameClient.initiateNewLeaderVote(playerId, roomId);
    },
    [playerId]
  );

  /**
   * Vote to usurp leader
   */
  const voteUsurp = useCallback(
    (roomId: RoomId, candidateId: string) => {
      if (!playerId) return;
      gameClient.voteUsurp(playerId, roomId, candidateId);
    },
    [playerId]
  );

  /**
   * Select hostage
   */
  const selectHostage = useCallback(
    (roomId: RoomId, targetPlayerId: string) => {
      if (!playerId) return;
      gameClient.selectHostage(playerId, roomId, targetPlayerId);
    },
    [playerId]
  );

  /**
   * Lock hostages
   */
  const lockHostages = useCallback(
    (roomId: RoomId) => {
      if (!playerId) return;
      gameClient.lockHostages(playerId, roomId);
    },
    [playerId]
  );

  /**
   * Disconnect from game
   */
  const disconnect = useCallback(() => {
    gameClient.disconnect();
    setIsConnected(false);
    setGameView(null);
    setPlayerId(null);
    setGameId(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      gameClient.disconnect();
    };
  }, []);

  return {
    gameView,
    isConnected,
    error,
    createGame,
    joinGame,
    lockRoom,
    selectRoles,
    setRounds,
    confirmRoles,
    startGame,
    nominateLeader,
    initiateNewLeaderVote,
    voteUsurp,
    selectHostage,
    lockHostages,
    disconnect
  };
}
