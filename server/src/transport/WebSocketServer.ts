/**
 * WebSocket Server
 *
 * Handles WebSocket connections for real-time game communication.
 */

import { WebSocketServer as WSServer, WebSocket } from 'ws';
import { Server as HTTPServer } from 'http';
import { ClientAction, ServerEvent, ServerEventType } from '@two-rooms/shared';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONNECTION
// ============================================================================

export interface Connection {
  id: string;
  ws: WebSocket;
  gameId: string | null;
  playerId: string | null;
  isAlive: boolean;
  lastHeartbeat: number;
}

// ============================================================================
// MESSAGE HANDLER
// ============================================================================

export type MessageHandler = (
  connection: Connection,
  action: ClientAction
) => void | Promise<void>;

export type ConnectionAssociatedHandler = (
  connection: Connection
) => void;

// ============================================================================
// WEBSOCKET SERVER
// ============================================================================

export class WebSocketServer {
  private wss: WSServer;
  private connections: Map<string, Connection> = new Map();
  private connectionsByPlayer: Map<string, Connection> = new Map();
  private messageHandler: MessageHandler | null = null;
  private connectionAssociatedHandler: ConnectionAssociatedHandler | null = null;
  private heartbeatInterval: NodeJS.Timeout;

  constructor(server: HTTPServer) {
    // Create WebSocket server
    this.wss = new WSServer({
      server,
      path: '/ws'
    });

    // Set up connection handler
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    // Start heartbeat check (every 30 seconds)
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
    }, 30000);

    console.log('WebSocket server initialized on /ws');
  }

  /**
   * Set message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  /**
   * Set connection associated handler (called when a connection is associated with a game/player)
   */
  onConnectionAssociated(handler: ConnectionAssociatedHandler): void {
    this.connectionAssociatedHandler = handler;
  }

  /**
   * Send event to a specific connection
   */
  send(connectionId: string, event: ServerEvent): void {
    const connection = this.connections.get(connectionId);
    if (connection && connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(event));
      } catch (error) {
        console.error(`Failed to send to connection ${connectionId}:`, error);
      }
    }
  }

  /**
   * Send event to a specific player
   */
  sendToPlayer(playerId: string, event: ServerEvent): void {
    const connection = this.connectionsByPlayer.get(playerId);
    if (connection) {
      this.send(connection.id, event);
    }
  }

  /**
   * Broadcast event to all connections in a game
   */
  broadcast(gameId: string, event: ServerEvent): void {
    for (const connection of this.connections.values()) {
      if (connection.gameId === gameId) {
        this.send(connection.id, event);
      }
    }
  }

  /**
   * Broadcast to all connections
   */
  broadcastAll(event: ServerEvent): void {
    for (const connection of this.connections.values()) {
      this.send(connection.id, event);
    }
  }

  /**
   * Get connection by player ID
   */
  getConnectionByPlayer(playerId: string): Connection | undefined {
    return this.connectionsByPlayer.get(playerId);
  }

  /**
   * Get all connections for a game
   */
  getConnectionsForGame(gameId: string): Connection[] {
    return Array.from(this.connections.values()).filter(
      (c) => c.gameId === gameId
    );
  }

  /**
   * Handle new connection
   */
  private handleConnection(ws: WebSocket): void {
    const connectionId = uuidv4();

    const connection: Connection = {
      id: connectionId,
      ws,
      gameId: null,
      playerId: null,
      isAlive: true,
      lastHeartbeat: Date.now()
    };

    this.connections.set(connectionId, connection);

    console.log(`New WebSocket connection: ${connectionId}`);

    // Set up message handler
    ws.on('message', (data: Buffer) => {
      this.handleMessage(connection, data);
    });

    // Set up pong handler (heartbeat response)
    ws.on('pong', () => {
      connection.isAlive = true;
      connection.lastHeartbeat = Date.now();
    });

    // Set up close handler
    ws.on('close', () => {
      this.handleDisconnect(connection);
    });

    // Set up error handler
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${connectionId}:`, error);
    });

    // Send welcome message
    this.send(connectionId, {
      type: ServerEventType.CONNECTED,
      payload: { connectionId },
      timestamp: Date.now()
    });
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(connection: Connection, data: Buffer): Promise<void> {
    try {
      const rawMessage = data.toString();
      console.log('📨 Raw WebSocket message:', rawMessage);
      const message = JSON.parse(rawMessage);

      // Validate message structure
      if (!message.type || !message.payload) {
        console.error('❌ Invalid message format:', message);
        console.error('❌ Raw message was:', rawMessage);
        return;
      }

      // Create ClientAction
      const action: ClientAction = {
        type: message.type,
        playerId: connection.playerId || '',
        payload: message.payload,
        timestamp: Date.now()
      };

      // Handle special connection messages
      if (message.type === 'CONNECT') {
        this.handleConnectMessage(connection, message.payload);
        return;
      }

      // Call message handler
      if (this.messageHandler) {
        await this.messageHandler(connection, action);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.send(connection.id, {
        type: ServerEventType.ERROR,
        payload: {
          message: 'Failed to process message',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle connect message (associates connection with game/player)
   */
  private handleConnectMessage(connection: Connection, payload: any): void {
    const { gameId, playerId } = payload;

    if (gameId) {
      connection.gameId = gameId;
    }

    if (playerId) {
      connection.playerId = playerId;
      this.connectionsByPlayer.set(playerId, connection);
    }

    console.log(
      `Connection ${connection.id} associated with game ${gameId}, player ${playerId}`
    );

    // Notify handler that connection is now associated
    if (this.connectionAssociatedHandler) {
      this.connectionAssociatedHandler(connection);
    }
  }

  /**
   * Handle disconnect
   */
  private handleDisconnect(connection: Connection): void {
    console.log(`WebSocket disconnected: ${connection.id}`);

    // Remove from maps
    this.connections.delete(connection.id);

    if (connection.playerId) {
      this.connectionsByPlayer.delete(connection.playerId);
    }

    // Notify game controller of disconnect
    // (This will be handled by the GameController)
  }

  /**
   * Check heartbeats and close stale connections
   */
  private checkHeartbeats(): void {
    const now = Date.now();
    const timeout = 60000; // 60 seconds

    for (const connection of this.connections.values()) {
      if (!connection.isAlive || now - connection.lastHeartbeat > timeout) {
        console.log(`Connection ${connection.id} failed heartbeat check, terminating`);
        connection.ws.terminate();
        this.handleDisconnect(connection);
      } else {
        // Send ping
        connection.isAlive = false;
        connection.ws.ping();
      }
    }
  }

  /**
   * Close all connections and shut down
   */
  close(): void {
    clearInterval(this.heartbeatInterval);

    for (const connection of this.connections.values()) {
      connection.ws.close();
    }

    this.wss.close();
    console.log('WebSocket server closed');
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get active games count
   */
  getActiveGamesCount(): number {
    const gameIds = new Set<string>();
    for (const connection of this.connections.values()) {
      if (connection.gameId) {
        gameIds.add(connection.gameId);
      }
    }
    return gameIds.size;
  }
}
