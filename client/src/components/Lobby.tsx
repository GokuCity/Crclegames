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
    <div className="max-w-sm mx-auto p-4 font-sans sm:max-w-md lg:max-w-xl">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Two Rooms and a Boom</h1>
        <div className="flex justify-center items-center gap-2 text-base sm:text-lg">
          <span>Room Code:</span>
          <span className="font-bold text-xl sm:text-2xl px-4 py-1 bg-gray-100 rounded-lg tracking-wider">
            {publicState.code}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-lg p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            Players ({playerCount}/30)
            {playerCount < 6 && (
              <span className="text-game-red text-sm font-normal"> - Need 6+ to start</span>
            )}
          </h2>
          <ul className="list-none p-0 m-0">
            {publicState.players.map((player) => (
              <li
                key={player.id}
                className="min-h-touch p-3 border-b border-gray-200 flex items-center gap-2"
              >
                <span className="flex-1">{player.name}</span>
                {player.isHost && (
                  <span className="bg-game-green text-white px-2 py-0.5 rounded text-xs font-bold">
                    HOST
                  </span>
                )}
                {player.connectionStatus === 'DISCONNECTED' && (
                  <span className="bg-game-red text-white px-2 py-0.5 rounded text-xs">
                    DISCONNECTED
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {isHost && !isLocked && (
          <div className="text-center py-5">
            <button
              onClick={onLockRoom}
              disabled={!canLock}
              className={`w-full min-h-touch px-6 py-3 text-base rounded-lg font-bold
                          transition-all border-none cursor-pointer
                          ${canLock
                            ? 'bg-game-green text-white active:scale-95'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
            >
              {canLock ? 'Lock Room' : `Need ${6 - playerCount} more players`}
            </button>
            <p className="mt-3 text-sm text-gray-600">
              Lock the room when all players have joined
            </p>
          </div>
        )}

        {isLocked && (
          <div className="text-center p-5 bg-gray-100 rounded-lg">
            <p className="m-0 text-base text-gray-800">
              Room is locked. Waiting for host to select roles...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
