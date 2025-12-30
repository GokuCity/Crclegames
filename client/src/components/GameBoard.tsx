/**
 * Game Board Component
 *
 * Main game interface with rooms, timer, and player actions.
 */

import React from 'react';
import { PlayerGameView, RoomId, GameStatus } from '@two-rooms/shared';

interface GameBoardProps {
  gameView: PlayerGameView;
  playerId: string;
  onNominateLeader: (roomId: RoomId, candidateId: string) => void;
  onInitiateNewLeaderVote: (roomId: RoomId) => void;
  onVoteUsurp: (roomId: RoomId, candidateId: string) => void;
  onSelectHostage: (roomId: RoomId, targetPlayerId: string) => void;
  onLockHostages: (roomId: RoomId) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameView,
  playerId,
  onNominateLeader,
  onInitiateNewLeaderVote,
  onSelectHostage,
  onLockHostages
}) => {
  const { public: publicState, playerPrivate } = gameView;
  const currentPlayer = publicState.players.find((p) => p.id === playerId);
  const myRoom = publicState.roomAssignments[playerId];
  const isLeader = currentPlayer?.isLeader || false;

  // Calculate required hostage count based on player count and round
  const calculateHostageCount = (playerCount: number, roundNumber: number): number => {
    if (playerCount >= 6 && playerCount <= 10) {
      return 1;
    } else if (playerCount >= 11 && playerCount <= 21) {
      return roundNumber === 1 ? 2 : 1;
    } else if (playerCount >= 22) {
      if (roundNumber === 1) return 3;
      if (roundNumber === 2) return 2;
      return 1;
    }
    return 1;
  };

  const requiredHostageCount = calculateHostageCount(
    publicState.players.length,
    publicState.currentRound
  );

  // Check if we're in hostage selection phase
  const isHostageSelectionPhase = publicState.paused &&
    publicState.pauseReason === 'Waiting for leaders to select hostages';

  const roomAPlayers = publicState.players.filter(
    (p) => publicState.roomAssignments[p.id] === RoomId.ROOM_A
  );
  const roomBPlayers = publicState.players.filter(
    (p) => publicState.roomAssignments[p.id] === RoomId.ROOM_B
  );

  const myRoomPlayers = myRoom === RoomId.ROOM_A ? roomAPlayers : roomBPlayers;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isRoundActive =
    publicState.status === GameStatus.ROUND_1 ||
    publicState.status === GameStatus.ROUND_2 ||
    publicState.status === GameStatus.ROUND_3 ||
    publicState.status === GameStatus.ROUND_4 ||
    publicState.status === GameStatus.ROUND_5;

  // Debug: Log timer state
  console.log('GameBoard render - Timer state:', {
    isRoundActive,
    timerRemaining: publicState.timer?.remaining,
    timerState: publicState.timer?.state,
    formatted: formatTime(publicState.timer?.remaining || 0)
  });

  if (publicState.status === GameStatus.FINISHED) {
    return (
      <div style={styles.container}>
        <h1>Game Finished!</h1>
        <div style={styles.winner}>
          <h2>Game Over - Check your role to see if you won!</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Two Rooms and a Boom</h1>
        {isRoundActive && (
          <div style={styles.timer}>
            <div style={styles.roundInfo}>Round {publicState.currentRound || 1}</div>
            <div style={styles.timerValue}>
              {formatTime(publicState.timer?.remaining || 0)}
            </div>
          </div>
        )}
      </div>

      <div style={styles.roleCard}>
        <div style={styles.roleLabel}>Your Role:</div>
        <div style={styles.roleName}>{playerPrivate?.role || 'Unknown'}</div>
        <div style={styles.roleTeam}>
          Team: {playerPrivate?.team || 'Unknown'}
          {isLeader && <span style={styles.leaderBadge}>LEADER</span>}
        </div>
      </div>

      <div style={styles.rooms}>
        <div style={{ ...styles.room, ...(myRoom === RoomId.ROOM_A && styles.myRoom) }}>
          <h2>
            Room A {myRoom === RoomId.ROOM_A && <span style={styles.yourRoomBadge}>You are here</span>}
          </h2>
          <div style={styles.playerList}>
            {roomAPlayers.map((player) => (
              <div key={player.id} style={styles.player}>
                <span>{player.name}</span>
                {player.isLeader && <span style={styles.badge}>LEADER</span>}
                {myRoom === RoomId.ROOM_A && !player.isLeader && isLeader && isHostageSelectionPhase && (
                  <button
                    onClick={() => onSelectHostage(RoomId.ROOM_A, player.id)}
                    style={{
                      ...styles.smallButton,
                      ...(publicState.rooms?.ROOM_A?.hostageCandidates?.includes(player.id)
                        ? styles.smallButtonSelected
                        : {})
                    }}
                  >
                    {publicState.rooms?.ROOM_A?.hostageCandidates?.includes(player.id)
                      ? '✓ Selected'
                      : 'Select as Hostage'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {myRoom === RoomId.ROOM_A && isLeader && isHostageSelectionPhase && (
            <div>
              <p style={styles.hostageCounter}>
                Selected: {publicState.rooms?.ROOM_A?.hostageCandidates?.length || 0} / {requiredHostageCount}
              </p>
              <button
                onClick={() => onLockHostages(RoomId.ROOM_A)}
                disabled={(publicState.rooms?.ROOM_A?.hostageCandidates?.length || 0) !== requiredHostageCount || publicState.rooms?.ROOM_A?.hostagesLocked}
                style={{
                  ...styles.button,
                  ...(publicState.rooms?.ROOM_A?.hostagesLocked
                    ? styles.buttonLocked
                    : (publicState.rooms?.ROOM_A?.hostageCandidates?.length || 0) === requiredHostageCount
                    ? styles.buttonEnabled
                    : styles.buttonDisabled)
                }}
              >
                {publicState.rooms?.ROOM_A?.hostagesLocked ? '✓ Locked - Waiting for other room' : 'Lock Hostages'}
              </button>
            </div>
          )}
        </div>

        <div style={{ ...styles.room, ...(myRoom === RoomId.ROOM_B && styles.myRoom) }}>
          <h2>
            Room B {myRoom === RoomId.ROOM_B && <span style={styles.yourRoomBadge}>You are here</span>}
          </h2>
          <div style={styles.playerList}>
            {roomBPlayers.map((player) => (
              <div key={player.id} style={styles.player}>
                <span>{player.name}</span>
                {player.isLeader && <span style={styles.badge}>LEADER</span>}
                {myRoom === RoomId.ROOM_B && !player.isLeader && isLeader && isHostageSelectionPhase && (
                  <button
                    onClick={() => onSelectHostage(RoomId.ROOM_B, player.id)}
                    style={{
                      ...styles.smallButton,
                      ...(publicState.rooms?.ROOM_B?.hostageCandidates?.includes(player.id)
                        ? styles.smallButtonSelected
                        : {})
                    }}
                  >
                    {publicState.rooms?.ROOM_B?.hostageCandidates?.includes(player.id)
                      ? '✓ Selected'
                      : 'Select as Hostage'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {myRoom === RoomId.ROOM_B && isLeader && isHostageSelectionPhase && (
            <div>
              <p style={styles.hostageCounter}>
                Selected: {publicState.rooms?.ROOM_B?.hostageCandidates?.length || 0} / {requiredHostageCount}
              </p>
              <button
                onClick={() => onLockHostages(RoomId.ROOM_B)}
                disabled={(publicState.rooms?.ROOM_B?.hostageCandidates?.length || 0) !== requiredHostageCount || publicState.rooms?.ROOM_B?.hostagesLocked}
                style={{
                  ...styles.button,
                  ...(publicState.rooms?.ROOM_B?.hostagesLocked
                    ? styles.buttonLocked
                    : (publicState.rooms?.ROOM_B?.hostageCandidates?.length || 0) === requiredHostageCount
                    ? styles.buttonEnabled
                    : styles.buttonDisabled)
                }}
              >
                {publicState.rooms?.ROOM_B?.hostagesLocked ? '✓ Locked - Waiting for other room' : 'Lock Hostages'}
              </button>
            </div>
          )}
        </div>
      </div>

      {myRoom && (() => {
        const myRoomState = publicState.rooms?.[myRoom];

        if (!myRoomState) {
          console.warn('No room state available for', myRoom);
          return null;
        }

        const hasVoted = myRoomState.leaderVotes[playerId] !== undefined;
        const votingActive = myRoomState.leaderVotingActive || !myRoomState.leaderId;
        const voteCount = Object.keys(myRoomState.leaderVotes).length;
        const totalPlayers = myRoomPlayers.length;

        console.log('Voting UI state:', { myRoom, hasVoted, votingActive, voteCount, totalPlayers, leaderVotes: myRoomState.leaderVotes });

        return (
          <div style={styles.actions}>
            {votingActive && (
              <>
                <h3>Vote for Leader ({voteCount}/{totalPlayers} voted)</h3>
                <div style={styles.nominationButtons}>
                  {myRoomPlayers.map((player) => {
                    const isSelected = hasVoted && myRoomState.leaderVotes[playerId] === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          console.log('Voting for:', player.name, player.id);
                          onNominateLeader(myRoom, player.id);
                        }}
                        style={{
                          ...styles.voteButton,
                          ...(isSelected ? styles.voteButtonSelected : styles.voteButtonUnselected),
                          ...(hasVoted && !isSelected ? styles.voteButtonDisabled : {})
                        }}
                        disabled={hasVoted && !isSelected}
                      >
                        {player.name}
                        {isSelected && <span style={styles.checkmark}> ✓</span>}
                      </button>
                    );
                  })}
                </div>
                {hasVoted && (
                  <p style={styles.votedMessage}>
                    ✓ You voted for {myRoomPlayers.find(p => p.id === myRoomState.leaderVotes[playerId])?.name}
                  </p>
                )}
              </>
            )}
            {!votingActive && !isLeader && publicState.currentRound > 1 && (
              <button
                onClick={() => onInitiateNewLeaderVote(myRoom)}
                style={{ ...styles.button, ...styles.buttonEnabled }}
              >
                Vote for New Leader
              </button>
            )}
          </div>
        );
      })()}

      {publicState.paused && !isHostageSelectionPhase && (
        <div style={styles.pausedOverlay}>
          <div style={styles.pausedMessage}>
            <h2>Game Paused</h2>
            <p>{publicState.pauseReason || 'Waiting...'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '20px'
  },
  timer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '10px'
  },
  roundInfo: {
    fontSize: '18px',
    fontWeight: 'bold'
  },
  timerValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#ff6b6b'
  },
  roleCard: {
    backgroundColor: '#f0f0f0',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginBottom: '30px'
  },
  roleLabel: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '5px'
  },
  roleName: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  roleTeam: {
    fontSize: '16px',
    color: '#333'
  },
  leaderBadge: {
    marginLeft: '10px',
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '2px 8px',
    borderRadius: '3px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  rooms: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  },
  room: {
    backgroundColor: '#fff',
    border: '2px solid #ccc',
    borderRadius: '8px',
    padding: '20px'
  },
  myRoom: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9'
  },
  yourRoomBadge: {
    fontSize: '14px',
    fontWeight: 'normal',
    color: '#4CAF50'
  },
  playerList: {
    marginTop: '15px'
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    borderBottom: '1px solid #eee'
  },
  badge: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  actions: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    marginTop: '20px'
  },
  nominationButtons: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginTop: '10px'
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold'
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
  buttonLocked: {
    backgroundColor: '#2196F3',
    color: 'white',
    cursor: 'not-allowed',
    opacity: 0.8
  },
  smallButton: {
    padding: '6px 12px',
    fontSize: '12px',
    borderRadius: '3px',
    border: '1px solid #4CAF50',
    backgroundColor: 'white',
    color: '#4CAF50',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  smallButtonSelected: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50'
  },
  hostageCounter: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center' as const
  },
  voteButton: {
    padding: '12px 20px',
    fontSize: '14px',
    borderRadius: '5px',
    border: '2px solid #ddd',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    minWidth: '120px'
  },
  voteButtonUnselected: {
    backgroundColor: 'white',
    color: '#333',
    borderColor: '#ddd'
  },
  voteButtonSelected: {
    backgroundColor: '#4CAF50',
    color: 'white',
    borderColor: '#4CAF50'
  },
  voteButtonDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#999',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  checkmark: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  votedMessage: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#e8f5e9',
    borderRadius: '5px',
    color: '#2e7d32',
    fontWeight: 'bold',
    textAlign: 'center' as const
  },
  pausedOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  pausedMessage: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    textAlign: 'center' as const
  },
  winner: {
    fontSize: '24px',
    textAlign: 'center' as const,
    marginTop: '50px',
    padding: '30px',
    backgroundColor: '#FFD700',
    borderRadius: '10px'
  }
};
