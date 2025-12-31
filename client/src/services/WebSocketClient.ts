/**
 * WebSocket Client
 *
 * Manages WebSocket connection to game server with automatic reconnection.
 */

import { ClientAction, ServerEvent } from '@two-rooms/shared';

export type EventHandler = (event: ServerEvent) => void;
export type ConnectionHandler = () => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private gameId: string | null = null;
  private playerId: string | null = null;
  private eventHandlers: EventHandler[] = [];
  private connectHandlers: ConnectionHandler[] = [];
  private disconnectHandlers: ConnectionHandler[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url?: string) {
    // Use relative WebSocket URL to work with Vite proxy in development
    if (!url) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host; // includes port
      this.url = `${protocol}//${host}/ws`;
    } else {
      this.url = url;
    }
    console.log('WebSocket client initialized with URL:', this.url);
  }

  /**
   * Connect to WebSocket server
   */
  connect(gameId: string, playerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gameId = gameId;
      this.playerId = playerId;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;

          // Send CONNECT message to associate this connection with game/player
          // Use setTimeout to ensure WebSocket is fully ready
          setTimeout(() => {
            this.sendConnectMessage();
          }, 100);

          this.startHeartbeat();
          this.connectHandlers.forEach((handler) => handler());
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const serverEvent: ServerEvent = JSON.parse(event.data);
            this.handleEvent(serverEvent);
          } catch (error) {
            console.error('Failed to parse server event:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.stopHeartbeat();
          this.disconnectHandlers.forEach((handler) => handler());
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send CONNECT message to associate this connection with game/player
   */
  private sendConnectMessage(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Cannot send CONNECT: WebSocket not open');
      return;
    }

    if (!this.gameId || !this.playerId) {
      console.error('Cannot send CONNECT: missing gameId or playerId');
      return;
    }

    try {
      const message = {
        type: 'CONNECT',
        payload: {
          gameId: this.gameId,
          playerId: this.playerId
        }
      };
      console.log('Sending CONNECT message:', message);
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send CONNECT message:', error);
    }
  }

  /**
   * Send action to server
   */
  send(action: ClientAction): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      const message = JSON.stringify(action);
      console.log('📤 Sending WebSocket message:', message);
      console.log('📤 Action object:', action);
      this.ws.send(message);
    } catch (error) {
      console.error('Failed to send action:', error);
    }
  }

  /**
   * Register event handler
   */
  onEvent(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register connection handler
   */
  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.push(handler);
    return () => {
      this.connectHandlers = this.connectHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Register disconnection handler
   */
  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.push(handler);
    return () => {
      this.disconnectHandlers = this.disconnectHandlers.filter((h) => h !== handler);
    };
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.gameId = null;
    this.playerId = null;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming event
   */
  private handleEvent(event: ServerEvent): void {
    // Deliver to handlers
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }

  /**
   * Start heartbeat monitoring
   *
   * Note: Browser WebSockets automatically respond to server ping frames with pong frames.
   * The server handles connection health monitoring via ping/pong.
   * Client-side heartbeat monitoring is disabled to avoid false disconnections during idle periods.
   */
  private startHeartbeat(): void {
    // Disabled: The server handles heartbeat via WebSocket ping/pong
    // Client-side monitoring can cause false disconnections when no events are sent
    /*
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - this.lastHeartbeat;

      // If no heartbeat for 60 seconds, connection is dead
      if (timeSinceLastHeartbeat > 60000) {
        console.error('Heartbeat timeout, reconnecting...');
        this.ws?.close();
      }
    }, 5000); // Check every 5 seconds
    */
  }

  /**
   * Stop heartbeat monitoring
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!this.gameId || !this.playerId) {
      return; // Cannot reconnect without game/player info
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
    );

    setTimeout(() => {
      if (this.gameId && this.playerId) {
        this.connect(this.gameId, this.playerId).catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }
    }, delay);
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
