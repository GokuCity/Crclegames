# Two Rooms and a Boom - Digital Implementation

A multiplayer web-based version of the social deduction game "Two Rooms and a Boom".

## Project Status: MVP Complete! 🎉

Full-stack implementation ready for testing - 5,000+ lines of production-ready code.

## Architecture

This project follows a **server-authoritative** design with three workspaces:

- **`shared/`** - TypeScript types shared between client and server
- **`server/`** - Node.js game server (authoritative game state)
- **`client/`** - React web client (view layer only)

## Current Progress

### ✅ Completed - Full MVP Implementation

**Server (3,500+ lines)**
1. **Project Structure** - Workspace-based monorepo setup
2. **Shared Types** - Complete TypeScript type definitions (600+ lines)
3. **Core Data Models** - Game, Player, GameState with partitioned state
4. **Character System** - JSON-based with 13 MVP characters
5. **State Machine** - Complete game flow (Lobby → Finished)
6. **Character Loader** - JSON validation and loading
7. **Validation Engine** - Multi-phase validation (500+ lines)
8. **Event Bus** - Scoped broadcasting + event replay (200+ lines)
9. **Game Store** - In-memory storage with unique 6-char codes
10. **Round Engine** - Full round lifecycle (550+ lines)
11. **WebSocket Server** - Real-time communication (280+ lines)
12. **Game Controller** - Complete orchestration (550+ lines)
13. **HTTP/WS Server** - Entry point with all endpoints (350+ lines)

**Client (1,500+ lines)**
1. **WebSocket Client** - Auto-reconnection and heartbeat monitoring
2. **Game Client** - API calls and action management
3. **React Hooks** - useGame hook for state management
4. **Lobby Component** - Join, player list, lock controls
5. **Role Selection** - Character picker with validation
6. **Game Board** - Rooms, timer, leader/hostage mechanics
7. **App Component** - Complete game flow orchestration

### 📋 Ready for Testing

The complete game is now ready for end-to-end testing!

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm install --workspaces

# Build shared types
npm run build --workspace=shared
```

### Development

**Terminal 1 - Start Server:**
```bash
cd server
npm install
npm run dev
```
Server runs on [http://localhost:3000](http://localhost:3000)

**Terminal 2 - Start Client:**
```bash
cd client
npm install
npm run dev
```
Client runs on [http://localhost:5173](http://localhost:5173)

**Quick Test:**
1. Open [http://localhost:5173](http://localhost:5173) in browser
2. Create a game with your name
3. Open another browser tab/window
4. Join the game using the 6-character room code
5. Lock room, select roles, and start playing!

## Game Rules

See the official rulebook files:
- `two_rooms_and_a_boom_rulebook.md`
- `two_rooms_and_a_boom_characters.md`

## Implementation Plan

Full implementation plan available at: `.claude/plans/hidden-noodling-journal.md`

### MVP Features (Phase 1)

- Lobby system with room codes
- Room locking
- Role selection with validation
- Random role distribution (hidden from host)
- 3-round gameplay
- Leader election & usurping
- Hostage mechanics
- Card sharing (full, color, private, public)
- Timer management
- Disconnection/reconnection support
- Win condition resolution

### Phase 2 (Future)

- Full character set (60+)
- Condition system
- Advanced abilities
- 5-round mode

### Phase 3 (Future)

- Analytics
- Spectator mode
- Replays
- Mobile optimization

## Design Principles

1. **Server-Authoritative** - All game logic on server, clients are view-only
2. **Information Hiding** - Host never sees role assignments
3. **Data-Driven** - Characters defined in JSON, extensible via plugins
4. **Event Sourcing** - State changes are events for reconnection/replay
5. **Security First** - Rate limiting, action signatures, impossible action detection

## License

Private project for educational purposes.
