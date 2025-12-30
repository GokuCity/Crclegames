# Two Rooms and a Boom - Client

React-based web client for the Two Rooms and a Boom multiplayer game.

## Features

- **Lobby System**: Create or join games with 6-character room codes
- **Role Selection**: Host selects character deck with real-time validation
- **Game Board**: Interactive game interface with rooms, timer, and player actions
- **WebSocket Connection**: Real-time communication with automatic reconnection
- **Responsive Design**: Works on desktop and mobile browsers

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **WebSocket** - Real-time communication

## Getting Started

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start dev server (runs on http://localhost:5173)
npm run dev
```

The dev server will proxy API requests to `http://localhost:3000` (ensure server is running).

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   ├── Lobby.tsx          # Lobby screen with player list
│   │   ├── RoleSelection.tsx  # Host role selection UI
│   │   └── GameBoard.tsx      # Main game interface
│   ├── hooks/
│   │   └── useGame.ts         # React hook for game state
│   ├── services/
│   │   ├── WebSocketClient.ts # WebSocket connection manager
│   │   └── GameClient.ts      # API client and game actions
│   ├── App.tsx                # Main app component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
├── index.html
├── vite.config.ts
└── package.json
```

## How to Play

1. **Create or Join Game**
   - Host creates a game and gets a 6-character room code
   - Players join using the room code

2. **Lobby**
   - Wait for 6-30 players to join
   - Host locks the room when ready

3. **Role Selection** (Host only)
   - Select exactly the right number of roles
   - President and Bomber are required
   - Confirm roles to distribute

4. **Game Play**
   - View your secret role
   - Nominate leaders for your room
   - Leaders select hostages
   - Exchange hostages between rounds
   - Complete 3 rounds

5. **Win Condition**
   - Red team wins if Bomber is with President
   - Blue team wins if President survives
   - Grey team characters have individual win conditions

## API Integration

The client communicates with the server via:

### HTTP REST API
- `POST /api/games` - Create game
- `POST /api/games/:code/join` - Join game
- `GET /api/games/:id/players/:pid` - Get game view

### WebSocket Events
- **Outgoing**: `LOCK_ROOM`, `SELECT_ROLES`, `CONFIRM_ROLES`, `START_GAME`, `NOMINATE_LEADER`, `VOTE_USURP`, `SELECT_HOSTAGE`, `LOCK_HOSTAGES`
- **Incoming**: `GAME_CREATED`, `PLAYER_JOINED`, `ROOM_LOCKED`, `ROLE_ASSIGNED`, `ROUND_STARTED`, `TIMER_UPDATE`, `LEADER_ELECTED`, `HOSTAGES_EXCHANGED`, etc.

## Configuration

Edit `vite.config.ts` to change server proxy settings:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // Change if server runs elsewhere
        changeOrigin: true
      }
    }
  }
});
```

## Troubleshooting

### WebSocket Connection Failed
- Ensure server is running on port 3000
- Check browser console for errors
- Verify firewall/proxy settings

### Game State Not Updating
- Check WebSocket connection status
- Server may have restarted (reconnection will attempt automatically)
- Refresh page to rejoin game

### Player Can't Join
- Verify room code is correct (case-insensitive)
- Room may be locked or full
- Game may have already started

## Future Enhancements

- Card sharing UI (full/color/private reveals)
- Ability activation buttons
- Win condition display
- Game history and replays
- Spectator mode
- Mobile app (PWA)

## License

Private project for educational purposes.
