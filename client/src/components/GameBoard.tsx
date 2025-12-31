/**
 * Game Board Component
 *
 * Main game interface with rooms, timer, and player actions.
 */

import React, { useState, useEffect } from 'react';
import { PlayerGameView, RoomId, GameStatus, TeamColor } from '@two-rooms/shared';
import { RulesContent } from './RulesContent';

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

  // State for popup modals
  const [showColourShare, setShowColourShare] = useState(false);
  const [showCardShare, setShowCardShare] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [activeTab, setActiveTab] = useState<'howToPlay' | 'roles'>('howToPlay');
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  // Determine team color for color share
  const getTeamColor = () => {
    if (playerPrivate?.team === TeamColor.BLUE) return '#2196F3';
    if (playerPrivate?.team === TeamColor.RED) return '#ff6b6b';
    if (playerPrivate?.team === TeamColor.GREEN) return '#4CAF50';
    if (playerPrivate?.team === TeamColor.PURPLE) return '#9C27B0';
    if (playerPrivate?.team === TeamColor.BLACK) return '#000000';
    if (playerPrivate?.team === TeamColor.PINK) return '#E91E63';
    if (playerPrivate?.team === TeamColor.GREY) return '#666666';
    return '#666666'; // Default grey
  };

  // Helper function for role display in Rules modal
  const getTeamColorForEnum = (team: TeamColor) => {
    switch (team) {
      case TeamColor.BLUE: return '#2196F3';
      case TeamColor.RED: return '#ff6b6b';
      case TeamColor.GREEN: return '#4CAF50';
      case TeamColor.PURPLE: return '#9C27B0';
      case TeamColor.BLACK: return '#000000';
      case TeamColor.PINK: return '#E91E63';
      case TeamColor.GREY: return '#666666';
      default: return '#666666';
    }
  };

  // Initialize selectedRoleId when Rules popup opens to Roles tab
  useEffect(() => {
    if (showRules && activeTab === 'roles' && playerPrivate?.characterDefinition) {
      // Only set if selectedRoleId is null (first time opening)
      if (selectedRoleId === null) {
        setSelectedRoleId(playerPrivate.characterDefinition.id);
      }
    }
  }, [showRules, activeTab]);

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
      <div className="max-w-full mx-auto p-4 font-sans sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
        <h1 className="text-2xl font-bold text-center sm:text-3xl">Game Finished!</h1>
        <div className="bg-game-gold p-6 rounded-lg text-center mt-6 sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">
            Game Over - Check your role to see if you won!
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 font-sans sm:max-w-2xl md:max-w-4xl lg:max-w-6xl">
      <div className="text-center mb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Two Rooms and a Boom</h1>
        {isRoundActive && (
          <div className="flex justify-center items-center gap-4 mt-2 flex-wrap">
            <div className="text-base font-bold sm:text-lg">
              Round {publicState.currentRound || 1}
            </div>
            <div className="text-2xl font-bold font-mono text-game-red sm:text-3xl md:text-4xl">
              {formatTime(publicState.timer?.remaining || 0)}
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-4 rounded-lg text-center mb-6 sm:p-5 md:p-6">
        <div className="text-xs text-gray-500 mb-1 sm:text-sm">Your Role:</div>
        <div className="text-xl font-bold mb-2 sm:text-2xl">
          {playerPrivate?.role || 'Unknown'}
        </div>
        <div className="text-sm text-game-gray-dark sm:text-base">
          Team: {playerPrivate?.team || 'Unknown'}
          {isLeader && (
            <span className="ml-2 bg-game-gold text-black px-2 py-0.5 rounded text-xs font-bold sm:text-sm">
              LEADER
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-5 md:grid-cols-2 md:gap-5">
        {/* Room A */}
        <div className={`bg-white border-2 rounded-lg p-4 sm:p-5
                         ${myRoom === RoomId.ROOM_A
                           ? 'border-game-green bg-green-50'
                           : 'border-gray-300'}`}>
          <h2 className="text-lg font-bold mb-3 sm:text-xl">
            Room A
            {myRoom === RoomId.ROOM_A && (
              <span className="text-sm font-normal text-game-green ml-2">
                You are here
              </span>
            )}
          </h2>
          <div className="mt-3 max-h-64 overflow-y-auto scrollable sm:max-h-96">
            {roomAPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-2 p-2 border-b border-gray-200 min-h-touch flex-wrap">
                <span className="flex-1 text-sm sm:text-base">{player.name}</span>
                {player.isLeader && (
                  <span className="bg-game-gold text-black px-2 py-0.5 rounded text-xs font-bold">
                    LEADER
                  </span>
                )}
                {myRoom === RoomId.ROOM_A && !player.isLeader && isLeader && isHostageSelectionPhase && (
                  <button
                    onClick={() => onSelectHostage(RoomId.ROOM_A, player.id)}
                    className={`min-h-touch px-3 py-2 text-xs rounded border font-bold
                                transition-all sm:text-sm active:scale-95
                                ${publicState.rooms?.ROOM_A?.hostageCandidates?.includes(player.id)
                                  ? 'bg-game-green text-white border-game-green'
                                  : 'bg-white text-game-green border-game-green'}`}
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
            <div className="mt-4">
              <p className="text-sm mb-2 text-center font-bold">
                Selected: {publicState.rooms?.ROOM_A?.hostageCandidates?.length || 0} / {requiredHostageCount}
              </p>
              <button
                onClick={() => onLockHostages(RoomId.ROOM_A)}
                disabled={(publicState.rooms?.ROOM_A?.hostageCandidates?.length || 0) !== requiredHostageCount || publicState.rooms?.ROOM_A?.hostagesLocked}
                className={`w-full min-h-touch px-6 py-3 text-sm rounded-lg border-none font-bold
                            transition-all sm:text-base
                            ${publicState.rooms?.ROOM_A?.hostagesLocked
                              ? 'bg-game-blue text-white cursor-not-allowed opacity-80'
                              : (publicState.rooms?.ROOM_A?.hostageCandidates?.length || 0) === requiredHostageCount
                              ? 'bg-game-green text-white cursor-pointer active:scale-95'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {publicState.rooms?.ROOM_A?.hostagesLocked
                  ? '✓ Locked - Waiting for other room'
                  : 'Lock Hostages'}
              </button>
            </div>
          )}
        </div>

        {/* Room B */}
        <div className={`bg-white border-2 rounded-lg p-4 sm:p-5
                         ${myRoom === RoomId.ROOM_B
                           ? 'border-game-green bg-green-50'
                           : 'border-gray-300'}`}>
          <h2 className="text-lg font-bold mb-3 sm:text-xl">
            Room B
            {myRoom === RoomId.ROOM_B && (
              <span className="text-sm font-normal text-game-green ml-2">
                You are here
              </span>
            )}
          </h2>
          <div className="mt-3 max-h-64 overflow-y-auto scrollable sm:max-h-96">
            {roomBPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-2 p-2 border-b border-gray-200 min-h-touch flex-wrap">
                <span className="flex-1 text-sm sm:text-base">{player.name}</span>
                {player.isLeader && (
                  <span className="bg-game-gold text-black px-2 py-0.5 rounded text-xs font-bold">
                    LEADER
                  </span>
                )}
                {myRoom === RoomId.ROOM_B && !player.isLeader && isLeader && isHostageSelectionPhase && (
                  <button
                    onClick={() => onSelectHostage(RoomId.ROOM_B, player.id)}
                    className={`min-h-touch px-3 py-2 text-xs rounded border font-bold
                                transition-all sm:text-sm active:scale-95
                                ${publicState.rooms?.ROOM_B?.hostageCandidates?.includes(player.id)
                                  ? 'bg-game-green text-white border-game-green'
                                  : 'bg-white text-game-green border-game-green'}`}
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
            <div className="mt-4">
              <p className="text-sm mb-2 text-center font-bold">
                Selected: {publicState.rooms?.ROOM_B?.hostageCandidates?.length || 0} / {requiredHostageCount}
              </p>
              <button
                onClick={() => onLockHostages(RoomId.ROOM_B)}
                disabled={(publicState.rooms?.ROOM_B?.hostageCandidates?.length || 0) !== requiredHostageCount || publicState.rooms?.ROOM_B?.hostagesLocked}
                className={`w-full min-h-touch px-6 py-3 text-sm rounded-lg border-none font-bold
                            transition-all sm:text-base
                            ${publicState.rooms?.ROOM_B?.hostagesLocked
                              ? 'bg-game-blue text-white cursor-not-allowed opacity-80'
                              : (publicState.rooms?.ROOM_B?.hostageCandidates?.length || 0) === requiredHostageCount
                              ? 'bg-game-green text-white cursor-pointer active:scale-95'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                {publicState.rooms?.ROOM_B?.hostagesLocked
                  ? '✓ Locked - Waiting for other room'
                  : 'Lock Hostages'}
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
          <div className="bg-white p-4 rounded-lg mt-5 sm:p-5">
            {votingActive && (
              <>
                <h3 className="text-lg font-bold mb-3 sm:text-xl">
                  Vote for Leader ({voteCount}/{totalPlayers} voted)
                </h3>
                <div className="flex flex-wrap gap-2 mt-2 sm:gap-3">
                  {myRoomPlayers.map((player) => {
                    const isSelected = hasVoted && myRoomState.leaderVotes[playerId] === player.id;
                    return (
                      <button
                        key={player.id}
                        onClick={() => {
                          console.log('Voting for:', player.name, player.id);
                          onNominateLeader(myRoom, player.id);
                        }}
                        disabled={hasVoted && !isSelected}
                        className={`min-h-touch min-w-touch px-4 py-3 text-sm rounded-lg border-2 font-bold
                                    transition-all flex-1 sm:flex-initial
                                    ${isSelected
                                      ? 'bg-game-green text-white border-game-green'
                                      : hasVoted
                                      ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                                      : 'bg-white text-game-gray-dark border-gray-300 cursor-pointer active:scale-95'}
                                    sm:min-w-[120px]`}
                      >
                        {player.name}
                        {isSelected && <span className="text-base font-bold ml-1"> ✓</span>}
                      </button>
                    );
                  })}
                </div>
                {hasVoted && (
                  <p className="text-sm text-game-green font-bold mt-3 text-center">
                    ✓ You voted for {myRoomPlayers.find(p => p.id === myRoomState.leaderVotes[playerId])?.name}
                  </p>
                )}
              </>
            )}

            {/* Action buttons - always visible */}
            <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:gap-4">
              {!votingActive && (
                <button
                  onClick={() => onInitiateNewLeaderVote(myRoom)}
                  className="flex-1 min-h-touch px-6 py-3 text-base rounded-lg border-none font-bold
                             transition-all cursor-pointer bg-game-green text-white active:scale-95"
                >
                  Vote for New Leader
                </button>
              )}
              <button
                onClick={() => setShowColourShare(true)}
                className="flex-1 min-h-touch px-6 py-3 text-base rounded-lg border-none font-bold
                           transition-all cursor-pointer bg-game-blue text-white active:scale-95"
              >
                Colour Share
              </button>
              <button
                onClick={() => setShowCardShare(true)}
                className="flex-1 min-h-touch px-6 py-3 text-base rounded-lg border-none font-bold
                           transition-all cursor-pointer bg-game-gold text-black active:scale-95"
              >
                Card Share
              </button>
              <button
                onClick={() => {
                  setShowRules(true);
                  setActiveTab('howToPlay');
                }}
                className="flex-1 min-h-touch px-6 py-3 text-base rounded-lg border-none font-bold
                           transition-all cursor-pointer bg-purple-600 text-white active:scale-95"
              >
                Rules
              </button>
            </div>
          </div>
        );
      })()}

      {/* Colour Share Popup - Full screen with just the color */}
      {showColourShare && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: getTeamColor() }}
          onClick={() => setShowColourShare(false)}
        >
          <button
            onClick={() => setShowColourShare(false)}
            className="absolute top-4 right-4 min-h-touch min-w-touch bg-white bg-opacity-90 text-black
                       rounded-full font-bold text-2xl flex items-center justify-center
                       active:scale-95 transition-all shadow-lg"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="text-white text-4xl font-bold text-center px-4 select-none">
            Tap anywhere to close
          </div>
        </div>
      )}

      {/* Card Share Popup - Full screen with color and role */}
      {showCardShare && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8"
          style={{ backgroundColor: getTeamColor() }}
          onClick={() => setShowCardShare(false)}
        >
          <button
            onClick={() => setShowCardShare(false)}
            className="absolute top-4 right-4 min-h-touch min-w-touch bg-white bg-opacity-90 text-black
                       rounded-full font-bold text-2xl flex items-center justify-center
                       active:scale-95 transition-all shadow-lg"
            aria-label="Close"
          >
            ✕
          </button>
          <div className="text-white text-center select-none">
            <div className="text-6xl font-bold mb-8 sm:text-7xl md:text-8xl">
              {playerPrivate?.role || 'Unknown'}
            </div>
            <div className="text-3xl font-bold sm:text-4xl md:text-5xl">
              Team: {playerPrivate?.team || 'Unknown'}
            </div>
            <div className="text-xl mt-8 opacity-80">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}

      {/* Rules Popup - Full screen with tabs */}
      {showRules && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header with close button */}
          <div className="flex justify-between items-center p-4 border-b border-gray-300 bg-gray-50">
            <h2 className="text-xl font-bold sm:text-2xl">Game Rules</h2>
            <button
              onClick={() => setShowRules(false)}
              className="min-h-touch min-w-touch bg-gray-200 text-black rounded-full font-bold text-2xl
                         flex items-center justify-center active:scale-95 transition-all"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-300 bg-gray-50">
            <button
              onClick={() => setActiveTab('howToPlay')}
              className={`flex-1 py-3 px-4 font-bold transition-all ${
                activeTab === 'howToPlay'
                  ? 'border-b-4 border-game-blue text-game-blue'
                  : 'text-gray-600'
              }`}
            >
              How to Play
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex-1 py-3 px-4 font-bold transition-all ${
                activeTab === 'roles'
                  ? 'border-b-4 border-game-blue text-game-blue'
                  : 'text-gray-600'
              }`}
            >
              Roles
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {activeTab === 'howToPlay' && <RulesContent />}

            {activeTab === 'roles' && (
              <div>
                {/* Role Dropdown - only show if there are multiple roles */}
                {playerPrivate?.gameRoles && playerPrivate.gameRoles.length > 1 && (
                  <div className="mb-4">
                    <label className="block text-sm font-bold mb-2">Select Role:</label>
                    <select
                      value={selectedRoleId || playerPrivate?.characterDefinition?.id || ''}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                      className="w-full p-3 border-2 border-gray-300 rounded-lg text-base"
                    >
                      {playerPrivate.gameRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} {role.id === playerPrivate.characterDefinition?.id ? '(You)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Role Details Display */}
                {(() => {
                  // Try to find the role from gameRoles first, otherwise use characterDefinition
                  let displayRole = playerPrivate?.gameRoles?.find(
                    (r) => r.id === (selectedRoleId || playerPrivate?.characterDefinition?.id)
                  );

                  // If no role found in gameRoles, use the player's characterDefinition directly
                  if (!displayRole && playerPrivate?.characterDefinition) {
                    displayRole = playerPrivate.characterDefinition;
                  }

                  if (!displayRole) {
                    return (
                      <div className="text-center text-gray-500 mt-8">
                        <p>No role information available yet.</p>
                        <p className="text-sm mt-2">Roles will be displayed once the game starts.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {/* Role Name & Team */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-2xl font-bold">{displayRole.name}</h3>
                        <span
                          className="px-3 py-1 rounded font-bold text-white"
                          style={{ backgroundColor: getTeamColorForEnum(displayRole.team) }}
                        >
                          {displayRole.team}
                        </span>
                        <span className="px-3 py-1 bg-gray-200 rounded font-bold">
                          Complexity: {displayRole.complexity}/5
                        </span>
                      </div>

                      {/* Description */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-bold mb-2">Description:</h4>
                        <p>{displayRole.description}</p>
                      </div>

                      {/* Abilities */}
                      {displayRole.abilities && displayRole.abilities.length > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Abilities:</h4>
                          {displayRole.abilities.map((ability, idx) => (
                            <div key={idx} className="mb-2 last:mb-0">
                              <p className="font-bold">{ability.name}</p>
                              <p className="text-sm text-gray-600">
                                Trigger: {ability.trigger}
                                {ability.usageLimit && ` (${ability.usageLimit.count}/${ability.usageLimit.per})`}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Win Conditions */}
                      {displayRole.winConditions && displayRole.winConditions.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-bold mb-2">Win Conditions:</h4>
                          {displayRole.winConditions.map((wc, idx) => (
                            <p key={idx} className="text-sm">
                              • {wc.type} {wc.overridesTeam ? '(Overrides team goal)' : ''}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {publicState.paused && !isHostageSelectionPhase && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-lg text-center max-w-sm sm:p-10 sm:max-w-md">
            <h2 className="text-xl font-bold mb-3 sm:text-2xl">Game Paused</h2>
            <p className="text-base sm:text-lg">
              {publicState.pauseReason || 'Waiting...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
