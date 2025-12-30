/**
 * App Component
 *
 * Main application component with game flow orchestration.
 */

import { useState } from 'react';
import { GameStatus } from '@two-rooms/shared';
import { useGame } from './hooks/useGame';
import { Lobby } from './components/Lobby';
import { RoleSelection } from './components/RoleSelection';
import { GameBoard } from './components/GameBoard';

function App() {
  const [screen, setScreen] = useState<'start' | 'game'>('start');
  const [hostName, setHostName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');

  const game = useGame();

  const handleCreateGame = async () => {
    if (!hostName.trim()) return;

    try {
      await game.createGame(hostName);
      setScreen('game');
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim() || !gameCode.trim()) return;

    try {
      await game.joinGame(gameCode.toUpperCase(), playerName);
      setScreen('game');
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  if (screen === 'start') {
    return (
      <div style={styles.container}>
        <div style={styles.startScreen}>
          <h1 style={styles.title}>Two Rooms and a Boom</h1>

          <div style={styles.card}>
            <h2>Create Game</h2>
            <input
              type="text"
              placeholder="Your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              style={styles.input}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
            />
            <button
              onClick={handleCreateGame}
              disabled={!hostName.trim()}
              style={{
                ...styles.button,
                ...(hostName.trim() ? styles.buttonEnabled : styles.buttonDisabled)
              }}
            >
              Create Game
            </button>
          </div>

          <div style={styles.divider}>OR</div>

          <div style={styles.card}>
            <h2>Join Game</h2>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Room code (e.g., ABC123)"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              style={styles.input}
              maxLength={6}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
            />
            <button
              onClick={handleJoinGame}
              disabled={!playerName.trim() || !gameCode.trim()}
              style={{
                ...styles.button,
                ...(playerName.trim() && gameCode.trim()
                  ? styles.buttonEnabled
                  : styles.buttonDisabled)
              }}
            >
              Join Game
            </button>
          </div>

          {game.error && (
            <div style={styles.error}>
              <strong>Error:</strong> {game.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!game.gameView) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  // Debug: Log what we received
  console.log('Game View:', game.gameView);

  const { public: publicState, playerPrivate } = game.gameView;

  // Safety check: ensure publicState exists
  if (!publicState) {
    console.error('Missing publicState in gameView:', game.gameView);
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <strong>Error:</strong> Invalid game state. Please refresh and try again.
        </div>
      </div>
    );
  }

  // Find current player's ID from gameView
  const myPlayerId = playerPrivate?.playerId || game.gameView.playerId || '';
  const currentPlayer = publicState.players?.find((p) => p.id === myPlayerId);
  const isHost = currentPlayer?.isHost || false;

  // Lobby screen
  if (
    publicState.status === GameStatus.LOBBY ||
    publicState.status === GameStatus.LOCKED
  ) {
    return (
      <div style={styles.container}>
        <Lobby
          gameView={game.gameView}
          isHost={isHost}
          onLockRoom={game.lockRoom}
        />
      </div>
    );
  }

  // Role selection screen
  if (
    publicState.status === GameStatus.ROLE_SELECTION ||
    publicState.status === GameStatus.ROLE_DISTRIBUTION ||
    publicState.status === GameStatus.ROOM_ASSIGNMENT
  ) {
    return (
      <div style={styles.container}>
        <RoleSelection
          gameView={game.gameView}
          isHost={isHost}
          onSelectRoles={game.selectRoles}
          onConfirmRoles={game.confirmRoles}
          onStartGame={game.startGame}
        />
      </div>
    );
  }

  // Game board screen
  return (
    <div style={styles.container}>
      <GameBoard
        gameView={game.gameView}
        playerId={myPlayerId}
        onNominateLeader={game.nominateLeader}
        onInitiateNewLeaderVote={game.initiateNewLeaderVote}
        onVoteUsurp={game.voteUsurp}
        onSelectHostage={game.selectHostage}
        onLockHostages={game.lockHostages}
      />
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  startScreen: {
    maxWidth: '500px',
    margin: '50px auto',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    textAlign: 'center' as const,
    fontSize: '32px',
    marginBottom: '40px',
    color: '#333'
  },
  card: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    marginBottom: '15px',
    boxSizing: 'border-box' as const
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  buttonEnabled: {
    backgroundColor: '#4CAF50',
    color: 'white'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    color: '#666',
    cursor: 'not-allowed'
  },
  divider: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: '14px',
    margin: '20px 0',
    fontWeight: 'bold'
  },
  error: {
    backgroundColor: '#ffe0e0',
    border: '1px solid #ff6b6b',
    borderRadius: '5px',
    padding: '15px',
    marginTop: '20px',
    color: '#d32f2f'
  },
  loading: {
    textAlign: 'center' as const,
    fontSize: '24px',
    marginTop: '100px',
    color: '#666'
  }
};

export default App;
