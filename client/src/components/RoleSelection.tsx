/**
 * Role Selection Component
 *
 * Host selects which characters to include in the game.
 */

import React, { useState, useEffect } from 'react';
import { CharacterId, PlayerGameView, GameStatus } from '@two-rooms/shared';

interface RoleSelectionProps {
  gameView: PlayerGameView;
  isHost: boolean;
  onSelectRoles: (roles: CharacterId[]) => void;
  onConfirmRoles: () => void;
  onStartGame: () => void;
}

// MVP Character list
const AVAILABLE_CHARACTERS: Array<{ id: CharacterId; name: string; team: string }> = [
  { id: 'president' as CharacterId, name: 'President', team: 'BLUE' },
  { id: 'bomber' as CharacterId, name: 'Bomber', team: 'RED' },
  { id: 'blue_team_member' as CharacterId, name: 'Blue Team Member', team: 'BLUE' },
  { id: 'red_team_member' as CharacterId, name: 'Red Team Member', team: 'RED' },
  { id: 'gambler' as CharacterId, name: 'Gambler', team: 'GREY' },
  { id: 'agent_blue' as CharacterId, name: 'Agent (Blue)', team: 'BLUE' },
  { id: 'agent_red' as CharacterId, name: 'Agent (Red)', team: 'RED' },
  { id: 'doctor' as CharacterId, name: 'Doctor', team: 'BLUE' },
  { id: 'engineer' as CharacterId, name: 'Engineer', team: 'RED' },
  { id: 'survivor' as CharacterId, name: 'Survivor', team: 'GREY' },
  { id: 'rival' as CharacterId, name: 'Rival', team: 'GREY' },
  { id: 'mi6' as CharacterId, name: 'MI6', team: 'GREY' },
  { id: 'born_leader' as CharacterId, name: 'Born Leader', team: 'GREY' }
];

export const RoleSelection: React.FC<RoleSelectionProps> = ({
  gameView,
  isHost,
  onSelectRoles,
  onConfirmRoles,
  onStartGame
}) => {
  const [selectedRoles, setSelectedRoles] = useState<CharacterId[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { public: publicState } = gameView;
  const playerCount = publicState.players.length;
  const requiredCount = publicState.config.buryCard ? playerCount - 1 : playerCount;
  const status = publicState.status;

  useEffect(() => {
    // Auto-select required characters
    if (selectedRoles.length === 0) {
      setSelectedRoles(['president' as CharacterId, 'bomber' as CharacterId]);
    }
  }, []);

  useEffect(() => {
    validateRoles();
  }, [selectedRoles]);

  const validateRoles = () => {
    const errors: string[] = [];

    if (!selectedRoles.includes('president' as CharacterId)) {
      errors.push('President is required');
    }

    if (!selectedRoles.includes('bomber' as CharacterId)) {
      errors.push('Bomber is required');
    }

    if (selectedRoles.length !== requiredCount) {
      errors.push(`Need exactly ${requiredCount} roles (have ${selectedRoles.length})`);
    }

    setValidationErrors(errors);
  };

  const toggleRole = (roleId: CharacterId) => {
    // Cannot remove required roles
    if (
      (roleId === 'president' || roleId === 'bomber') &&
      selectedRoles.includes(roleId)
    ) {
      return;
    }

    if (selectedRoles.includes(roleId)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== roleId));
    } else {
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };

  const handleConfirm = () => {
    if (validationErrors.length === 0) {
      onSelectRoles(selectedRoles);
      onConfirmRoles();
    }
  };

  const handleStart = () => {
    onStartGame();
  };

  const isRoleRequired = (roleId: CharacterId) => {
    return roleId === 'president' || roleId === 'bomber';
  };

  const isRoleSelected = (roleId: CharacterId) => {
    return selectedRoles.includes(roleId);
  };

  if (status === GameStatus.ROLE_DISTRIBUTION || status === GameStatus.ROOM_ASSIGNMENT) {
    return (
      <div className="max-w-md mx-auto p-4 font-sans sm:max-w-lg md:max-w-2xl">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-3">Roles Confirmed!</h2>
        <p className="text-center mb-5">Distributing roles to players...</p>
        {gameView.playerPrivate?.role && (
          <div className="bg-gray-100 p-5 rounded-lg text-center mt-5 sm:p-6">
            <h3 className="text-lg font-bold mb-2">Your Role:</h3>
            <div className="text-2xl font-bold mt-3 sm:text-3xl">
              {gameView.playerPrivate.role}
            </div>
          </div>
        )}
        {isHost && status === GameStatus.ROOM_ASSIGNMENT && (
          <button
            onClick={handleStart}
            className="w-full min-h-touch px-6 py-3 text-base rounded-lg font-bold
                       transition-all border-none cursor-pointer bg-game-green text-white
                       active:scale-95 mt-5"
          >
            Start Game
          </button>
        )}
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="max-w-md mx-auto p-4 font-sans sm:max-w-lg text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-3">Waiting for Host</h2>
        <p>The host is selecting roles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 font-sans sm:max-w-lg md:max-w-2xl lg:max-w-4xl">
      <div className="text-center mb-5">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Select Roles</h2>
        <p className="text-base">
          Choose {requiredCount} roles ({selectedRoles.length}/{requiredCount})
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-game-red rounded-lg p-4 mb-5">
          {validationErrors.map((error, i) => (
            <div key={i} className="text-red-700 mb-1 last:mb-0">
              {error}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {AVAILABLE_CHARACTERS.map((char) => {
          const selected = isRoleSelected(char.id);
          const required = isRoleRequired(char.id);

          return (
            <div
              key={char.id}
              onClick={() => toggleRole(char.id)}
              className={`min-h-touch p-4 border-2 rounded-lg text-center transition-all
                          relative active:scale-95
                          ${selected ? 'border-game-green bg-green-50' : 'border-gray-300'}
                          ${required ? 'border-game-blue bg-blue-50' : ''}
                          ${required && selected ? 'cursor-not-allowed' : 'cursor-pointer'}
                          hover:shadow-md`}
            >
              <div className="font-bold mb-1 text-base">{char.name}</div>
              <div className="text-xs text-gray-500">{char.team}</div>
              {required && (
                <div className="absolute top-1 right-1 text-xs bg-game-blue text-white
                                px-2 py-0.5 rounded">
                  REQUIRED
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <button
          onClick={handleConfirm}
          disabled={validationErrors.length > 0}
          className={`w-full min-h-touch px-6 py-3 text-base rounded-lg font-bold
                      transition-all border-none
                      ${validationErrors.length === 0
                        ? 'bg-game-green text-white cursor-pointer active:scale-95'
                        : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
        >
          Confirm Roles
        </button>
      </div>
    </div>
  );
};
