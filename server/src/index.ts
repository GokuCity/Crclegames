/**
 * Server Entry Point
 *
 * Initializes HTTP server, WebSocket server, and game controller.
 */

import * as http from 'http';
import { WebSocketServer } from './transport/WebSocketServer';
import { GameController } from './controllers/GameController';
import { ClientAction, ClientActionType, ServerEventType } from '@two-rooms/shared';
import { Connection } from './transport/WebSocketServer';
import { eventBus } from './services/EventBus';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 3000;

// ============================================================================
// INITIALIZE
// ============================================================================

async function main() {
  console.log('Starting Two Rooms and a Boom server...');

  // Create game controller
  const gameController = new GameController();
  await gameController.initialize();

  // Create HTTP server
  const server = http.createServer((req, res) => {
    handleHTTPRequest(req, res, gameController);
  });

  // Create WebSocket server
  const wsServer = new WebSocketServer(server);

  // Set up WebSocket message handler
  wsServer.onMessage(async (connection, action) => {
    await handleWebSocketMessage(connection, action, gameController, wsServer);
  });

  // Bridge EventBus to WebSocket Server
  // When a connection is associated with a game/player, subscribe to EventBus
  const subscriptions = new Map<string, string>(); // connectionId -> subscriptionId

  wsServer.onConnectionAssociated((connection) => {
    console.log(`onConnectionAssociated called for connection ${connection.id}`);
    if (connection.gameId && connection.playerId) {
      console.log(`Connection has gameId: ${connection.gameId}, playerId: ${connection.playerId}`);
      const subscriptionId = eventBus.subscribe(
        connection.gameId,
        (event) => {
          console.log(`EventBus event received for connection ${connection.id}:`, event.type);
          // Send event through WebSocket
          wsServer.send(connection.id, {
            type: event.type as any, // GameEvent.type is string, ServerEvent.type is ServerEventType
            payload: event.payload,
            timestamp: event.timestamp
          });
        },
        connection.playerId
      );
      subscriptions.set(connection.id, subscriptionId);
      console.log(`✅ Subscribed connection ${connection.id} to game ${connection.gameId} events (subscription: ${subscriptionId})`);
    } else {
      console.log(`❌ Connection missing gameId or playerId: gameId=${connection.gameId}, playerId=${connection.playerId}`);
    }
  });

  // Start server
  // IMPORTANT: Listen on 0.0.0.0 for Railway deployment
  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    console.log(`✅ WebSocket endpoint: ws://0.0.0.0:${PORT}/ws`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    wsServer.close();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
}

// ============================================================================
// HTTP REQUEST HANDLER
// ============================================================================

function handleHTTPRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  gameController: GameController
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url || '';
  const method = req.method || '';

  // Health check
  if (url === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  // Create game
  if (url === '/api/games' && method === 'POST') {
    handleCreateGame(req, res, gameController);
    return;
  }

  // Join game
  if (url.startsWith('/api/games/') && url.includes('/join') && method === 'POST') {
    const code = url.split('/')[3];
    handleJoinGame(req, res, code, gameController);
    return;
  }

  // Get game state
  if (url.startsWith('/api/games/') && method === 'GET') {
    const parts = url.split('/');
    const gameId = parts[3];
    const playerId = parts[5]; // /api/games/:id/players/:playerId
    handleGetGameState(res, gameId, playerId, gameController);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}

// ============================================================================
// HTTP HANDLERS
// ============================================================================

function handleCreateGame(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  gameController: GameController
) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { hostName } = JSON.parse(body);

      if (!hostName || typeof hostName !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'hostName is required' }));
        return;
      }

      const result = gameController.createGame(hostName);

      if (result.success && result.data) {
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...result.data,
          playerName: hostName
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Invalid request'
        })
      );
    }
  });
}

function handleJoinGame(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  code: string,
  gameController: GameController
) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const { playerName } = JSON.parse(body);

      if (!playerName || typeof playerName !== 'string') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'playerName is required' }));
        return;
      }

      const result = gameController.joinGame(code, playerName, '');

      if (result.success && result.data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ...result.data,
          playerName: playerName,
          code: code
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: result.error }));
      }
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Invalid request'
        })
      );
    }
  });
}

function handleGetGameState(
  res: http.ServerResponse,
  gameId: string,
  playerId: string,
  gameController: GameController
) {
  const gameView = gameController.getPlayerGameView(gameId, playerId);

  if (gameView) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(gameView));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Game or player not found' }));
  }
}

// ============================================================================
// WEBSOCKET MESSAGE HANDLER
// ============================================================================

async function handleWebSocketMessage(
  connection: Connection,
  action: ClientAction,
  gameController: GameController,
  wsServer: WebSocketServer
) {
  try {
    console.log(`Received action: ${action.type} from player ${action.playerId}`);

    let result: any;

    switch (action.type) {
      case ClientActionType.LOCK_ROOM:
        result = await gameController.lockRoom(connection.gameId!, action.playerId);
        break;

      case ClientActionType.SELECT_ROLES:
        result = gameController.selectRoles(
          connection.gameId!,
          action.playerId,
          action.payload.roles
        );
        break;

      case ClientActionType.SET_ROUNDS:
        result = gameController.setRounds(
          connection.gameId!,
          action.playerId,
          action.payload.totalRounds
        );
        break;

      case ClientActionType.CONFIRM_ROLES:
        result = await gameController.confirmRoles(
          connection.gameId!,
          action.playerId
        );
        break;

      case ClientActionType.START_GAME:
        result = await gameController.startGame(
          connection.gameId!,
          action.playerId
        );
        break;

      case ClientActionType.NOMINATE_LEADER:
        result = gameController.nominateLeader(
          connection.gameId!,
          action.playerId,
          action.payload.roomId,
          action.payload.candidateId
        );
        break;

      case ClientActionType.INITIATE_NEW_LEADER_VOTE:
        result = gameController.initiateNewLeaderVote(
          connection.gameId!,
          action.playerId,
          action.payload.roomId
        );
        break;

      case ClientActionType.VOTE_USURP:
        result = gameController.voteUsurp(
          connection.gameId!,
          action.playerId,
          action.payload.roomId,
          action.payload.candidateId
        );
        break;

      case ClientActionType.SELECT_HOSTAGE:
        result = gameController.selectHostage(
          connection.gameId!,
          action.playerId,
          action.payload.roomId,
          action.payload.targetPlayerId
        );
        break;

      case ClientActionType.LOCK_HOSTAGES:
        result = gameController.lockHostages(
          connection.gameId!,
          action.playerId,
          action.payload.roomId
        );
        break;

      default:
        wsServer.send(connection.id, {
          type: ServerEventType.ERROR,
          payload: { message: `Unknown action type: ${action.type}` },
          timestamp: Date.now()
        });
        return;
    }

    // Send result back to client
    if (result && !result.success) {
      wsServer.send(connection.id, {
        type: ServerEventType.ERROR,
        payload: { message: result.error, context: result.context },
        timestamp: Date.now()
      });
    }
  } catch (error) {
    console.error('Error handling WebSocket message:', error);
    wsServer.send(connection.id, {
      type: ServerEventType.ERROR,
      payload: {
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: Date.now()
    });
  }
}

// ============================================================================
// START SERVER
// ============================================================================

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
