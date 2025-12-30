/**
 * Lobby Component
 *
 * Displays game lobby with player list and host controls.
 */

import React from 'react';
import { PlayerGameView, GameStatus } from '@two-rooms/shared';

interface LobbyProps {
  gameView: PlayerGameView;
  isHost: boolean;
  onLockRoom: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ gameView, isHost, onLockRoom }) => {
  const { public: publicState } = gameView;
  const isLocked = publicState.status === GameStatus.LOCKED;
  const playerCount = publicState.players.length;
  const canLock = playerCount >= 6 && playerCount <= 30;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Two Rooms and a Boom</h1>
        <div style={styles.code}>
          <span>Room Code:</span>
          <span style={styles.codeValue}>{publicState.code}</span>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.playerList}>
          <h2>
            Players ({playerCount}/30)
            {playerCount < 6 && <span style={styles.warning}> - Need 6+ to start</span>}
          </h2>
          <ul style={styles.list}>
            {publicState.players.map((player) => (
              <li key={player.id} style={styles.playerItem}>
                {player.name}
                {player.isHost && <span style={styles.badge}>HOST</span>}
                {player.connectionStatus === 'DISCONNECTED' && (
                  <span style={styles.disconnected}>DISCONNECTED</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost && !isLocked && (
          <div style={styles.hostControls}>
            <button
              onClick={onLockRoom}
              disabled={!canLock}
              style={{
                ...styles.button,
                ...(canLock ? styles.buttonEnabled : styles.buttonDisabled)
              }}
            >
              {canLock ? 'Lock Room' : `Need ${6 - playerCount} more players`}
            </button>
            <p style={styles.hint}>Lock the room when all players have joined</p>
          </div>
        )}

        {isLocked && (
          <div style={styles.status}>
            <p style={styles.statusText}>Room is locked. Waiting for host to select roles...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px'
  },
  code: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    fontSize: '18px',
    marginTop: '10px'
  },
  codeValue: {
    fontWeight: 'bold',
    fontSize: '24px',
    padding: '5px 15px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px',
    letterSpacing: '2px'
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  playerList: {
    marginBottom: '20px'
  },
  warning: {
    color: '#ff6b6b',
    fontSize: '14px',
    fontWeight: 'normal'
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  playerItem: {
    padding: '10px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  badge: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  disconnected: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px'
  },
  hostControls: {
    textAlign: 'center' as const,
    padding: '20px 0'
  },
  button: {
    padding: '12px 30px',
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
  hint: {
    marginTop: '10px',
    fontSize: '14px',
    color: '#666'
  },
  status: {
    textAlign: 'center' as const,
    padding: '20px',
    backgroundColor: '#f0f0f0',
    borderRadius: '5px'
  },
  statusText: {
    margin: 0,
    fontSize: '16px',
    color: '#333'
  }
};
