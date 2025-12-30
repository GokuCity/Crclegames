/**
 * Game Store
 *
 * In-memory storage for active games.
 * In production, this would be backed by a database.
 */

import { Game, createInitialGameState, createPlayer } from '../core/GameState';
import { GameConfig } from '@two-rooms/shared';
import { v4 as uuidv4 } from 'uuid';

export class GameStore {
  private games: Map<string, Game> = new Map();
  private gamesByCode: Map<string, string> = new Map(); // code -> gameId

  /**
   * Create a new game
   */
  createGame(hostName: string, config?: Partial<GameConfig>): Game {
    const gameId = uuidv4();
    const code = this.generateRoomCode();
    const hostId = uuidv4();

    const game: Game = {
      id: gameId,
      code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 0,
      config: {
        totalRounds: config?.totalRounds || 3,
        roundDurations: config?.roundDurations || [180000, 120000, 60000],
        enableAdvancedCharacters: config?.enableAdvancedCharacters ?? false,
        enableConditions: config?.enableConditions ?? false,
        buryCard: config?.buryCard ?? false,
        selectedRoles: config?.selectedRoles || []
      },
      players: new Map(),
      state: createInitialGameState(gameId, code, hostId),
      events: []
    };

    // Create host player
    const host = createPlayer(hostId, hostName, true, '');
    game.players.set(hostId, host);

    // Store game
    this.games.set(gameId, game);
    this.gamesByCode.set(code, gameId);

    console.log(`Created game ${gameId} with code ${code}`);
    return game;
  }

  /**
   * Get a game by ID
   */
  get(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  /**
   * Get a game by room code
   */
  getByCode(code: string): Game | undefined {
    const gameId = this.gamesByCode.get(code.toUpperCase());
    return gameId ? this.games.get(gameId) : undefined;
  }

  /**
   * Update a game
   */
  update(game: Game): void {
    game.updatedAt = Date.now();
    this.games.set(game.id, game);
  }

  /**
   * Delete a game
   */
  delete(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      this.gamesByCode.delete(game.code);
      this.games.delete(gameId);
      console.log(`Deleted game ${gameId}`);
    }
  }

  /**
   * Get all active games
   */
  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  /**
   * Get games by status
   */
  getGamesByStatus(status: string): Game[] {
    return this.getAllGames().filter((g) => g.state.public.status === status);
  }

  /**
   * Clean up old finished games (called periodically)
   */
  cleanupOldGames(maxAgeMs: number = 3600000): void {
    // Default: 1 hour
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [gameId, game] of this.games.entries()) {
      if (
        game.state.public.status === 'FINISHED' &&
        now - game.updatedAt > maxAgeMs
      ) {
        toDelete.push(gameId);
      }
    }

    for (const gameId of toDelete) {
      this.delete(gameId);
    }

    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} old games`);
    }
  }

  /**
   * Generate a unique 6-character room code
   */
  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars (I, O, 0, 1)
    let code: string;
    let attempts = 0;

    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      attempts++;

      if (attempts > 100) {
        throw new Error('Failed to generate unique room code');
      }
    } while (this.gamesByCode.has(code));

    return code;
  }

  /**
   * Get game count
   */
  getGameCount(): number {
    return this.games.size;
  }
}

// Singleton instance
export const gameStore = new GameStore();
