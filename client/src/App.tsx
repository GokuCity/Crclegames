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
      <div className="min-h-screen bg-game-gray-light p-4">
        <div className="max-w-sm mx-auto pt-8 font-sans sm:max-w-md sm:pt-12 lg:pt-16">
          <h1 className="text-center text-2xl mb-8 text-game-gray-dark sm:text-3xl sm:mb-10">
            Two Rooms and a Boom
          </h1>

          <div className="bg-white p-6 rounded-lg shadow-sm mb-4 sm:p-8">
            <h2 className="text-xl font-bold mb-4">Create Game</h2>
            <input
              type="text"
              placeholder="Your name"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateGame()}
              className="w-full min-h-touch px-3 py-3 text-base border border-gray-300
                         rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-game-green"
            />
            <button
              onClick={handleCreateGame}
              disabled={!hostName.trim()}
              className={`w-full min-h-touch px-3 py-3 text-base rounded-lg border-none
                          font-bold transition-all
                          ${hostName.trim()
                            ? 'bg-game-green text-white cursor-pointer active:scale-95'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Create Game
            </button>
          </div>

          <div className="text-center text-gray-500 text-sm my-4 font-bold">OR</div>

          <div className="bg-white p-6 rounded-lg shadow-sm mb-4 sm:p-8">
            <h2 className="text-xl font-bold mb-4">Join Game</h2>
            <input
              type="text"
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full min-h-touch px-3 py-3 text-base border border-gray-300
                         rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-game-green"
            />
            <input
              type="text"
              placeholder="Room code (e.g., ABC123)"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoinGame()}
              maxLength={6}
              className="w-full min-h-touch px-3 py-3 text-base border border-gray-300
                         rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-game-green
                         uppercase"
            />
            <button
              onClick={handleJoinGame}
              disabled={!playerName.trim() || !gameCode.trim()}
              className={`w-full min-h-touch px-3 py-3 text-base rounded-lg border-none
                          font-bold transition-all
                          ${playerName.trim() && gameCode.trim()
                            ? 'bg-game-green text-white cursor-pointer active:scale-95'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              Join Game
            </button>
          </div>

          {game.error && (
            <div className="bg-red-50 border border-game-red rounded-lg p-4 mt-5 text-red-700">
              <strong>Error:</strong> {game.error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!game.gameView) {
    return (
      <div className="min-h-screen bg-game-gray-light p-4">
        <div className="text-center text-2xl mt-24 text-gray-600">Loading...</div>
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
      <div className="min-h-screen bg-game-gray-light p-4">
        <div className="bg-red-50 border border-game-red rounded-lg p-4 mt-5 text-red-700
                        max-w-sm mx-auto">
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
      <div className="min-h-screen bg-game-gray-light p-4">
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
      <div className="min-h-screen bg-game-gray-light p-4">
        <RoleSelection
          gameView={game.gameView}
          isHost={isHost}
          onSelectRoles={game.selectRoles}
          onSetRounds={game.setRounds}
          onConfirmRoles={game.confirmRoles}
          onStartGame={game.startGame}
        />
      </div>
    );
  }

  // Game board screen
  return (
    <div className="min-h-screen bg-game-gray-light p-4">
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

export default App;
