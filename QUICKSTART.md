# Quick Start Guide

Get Two Rooms and a Boom running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Two terminal windows
- A web browser

## Step 1: Install Dependencies

```bash
# In project root
cd "C:\Users\gauth\OneDrive\Desktop\Two Rooms and a Boom"

# Install shared types
cd shared
npm install
npm run build

# Install server dependencies
cd ../server
npm install

# Install client dependencies
cd ../client
npm install
```

## Step 2: Start the Server

**Terminal 1:**
```bash
cd server
npm run dev
```

You should see:
```
✅ Server running on http://localhost:3000
✅ WebSocket endpoint: ws://localhost:3000/ws
```

## Step 3: Start the Client

**Terminal 2:**
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Step 4: Test the Game

### Create a Game (Player 1)

1. Open http://localhost:5173 in your browser
2. Enter your name (e.g., "Alice")
3. Click "Create Game"
4. You'll see a 6-character room code (e.g., "ABC123")

### Join the Game (Player 2-6)

1. Open http://localhost:5173 in **5 more tabs** (or browsers/devices)
2. For each tab:
   - Enter a different name (e.g., "Bob", "Charlie", "Diana", "Eve", "Frank")
   - Enter the room code from step 4
   - Click "Join Game"

### Play the Game

**As Host (Alice):**
1. Click "Lock Room" (after 6+ players join)
2. Select 6 roles from the character list
   - President and Bomber are pre-selected (required)
   - Click other characters to add them (e.g., Gambler, Blue Team Member x2, Red Team Member)
3. Click "Confirm Roles"
4. Click "Start Game" (after roles are distributed)

**All Players:**
1. View your secret role card
2. See which room you're in (A or B)
3. Nominate a leader for your room
4. Leader selects hostages
5. Leader clicks "Lock Hostages"
6. Watch the timer count down
7. Hostages exchange between rooms
8. Continue for 3 rounds

## Troubleshooting

### Server Won't Start
- **Error**: Port 3000 in use
- **Fix**: Kill the process using port 3000 or change PORT in server/.env

### Client Won't Start
- **Error**: Port 5173 in use
- **Fix**: Vite will auto-increment to 5174

### WebSocket Connection Failed
- **Check**: Server is running on port 3000
- **Check**: Browser console for errors
- **Try**: Refresh the page

### "Game or player not found"
- **Fix**: Server may have restarted (games are in-memory)
- **Solution**: Create a new game

### Roles Don't Distribute
- **Check**: You selected exactly 6 roles (for 6 players)
- **Check**: President and Bomber are both selected

## What to Test

### Lobby Flow
- ✅ Create game generates unique code
- ✅ Players can join with code
- ✅ Player list updates in real-time
- ✅ Host can lock room (only with 6-30 players)

### Role Selection
- ✅ President + Bomber are required (can't be removed)
- ✅ Must select exact player count
- ✅ Validation errors show clearly
- ✅ Each player receives private role

### Game Play
- ✅ Timer counts down (3min, 2min, 1min)
- ✅ Players see their own room
- ✅ Leader nomination works
- ✅ Leader can select hostages
- ✅ Hostages lock when both rooms ready
- ✅ 30-second parlay starts
- ✅ Hostages exchange between rooms
- ✅ Game continues for 3 rounds

## Next Steps

After verifying the basic flow works:

1. **Test Disconnection**: Close a tab and rejoin
2. **Test Usurping**: Multiple players vote for new leader
3. **Test Edge Cases**: 10 players, 30 players, odd numbers
4. **Test Grey Characters**: Gambler, Survivor, MI6, Born Leader
5. **Test Abilities**: Agent (force card share once per round)

## Known Limitations (MVP)

- Card sharing UI not implemented (manual for now)
- Win condition resolution not fully implemented
- No ability activation buttons yet
- Timer pause/resume not exposed to UI
- No game history or replays

## Development Notes

### File Structure
```
server/src/
  ├── index.ts              # HTTP/WS server
  ├── controllers/
  │   └── GameController.ts # Main game logic
  ├── engines/
  │   ├── RoundEngine.ts    # Round mechanics
  │   └── ValidationEngine.ts
  └── services/
      ├── EventBus.ts       # Real-time events
      └── GameStore.ts      # In-memory storage

client/src/
  ├── App.tsx               # Main component
  ├── components/
  │   ├── Lobby.tsx
  │   ├── RoleSelection.tsx
  │   └── GameBoard.tsx
  ├── hooks/
  │   └── useGame.ts        # Game state hook
  └── services/
      ├── GameClient.ts     # API client
      └── WebSocketClient.ts
```

### Debug Mode

**Server logs:**
```bash
# In server terminal, you'll see:
Received action: LOCK_ROOM from player abc-123
Created game xyz-789 with code ABC123
```

**Client logs:**
```javascript
// In browser console:
console.log('Received event:', event.type, event.payload)
```

## Need Help?

- Check [TESTING.md](TESTING.md) for detailed test scenarios
- Check [SUMMARY.md](SUMMARY.md) for architecture overview
- Check server/client logs for errors

## Success Criteria

You've successfully completed the quickstart if:

✅ Server starts without errors
✅ Client starts and loads at localhost:5173
✅ You can create a game and get a room code
✅ 5 other players can join
✅ Host can lock room and select roles
✅ All players receive their secret roles
✅ Game starts and timer counts down
✅ Leader can be nominated
✅ Hostages can be selected and exchanged

**Congratulations! The MVP is working!** 🎉
