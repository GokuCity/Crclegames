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
      <div style={styles.container}>
        <h2>Roles Confirmed!</h2>
        <p>Distributing roles to players...</p>
        {gameView.playerPrivate?.role && (
          <div style={styles.roleCard}>
            <h3>Your Role:</h3>
            <div style={styles.roleName}>{gameView.playerPrivate.role}</div>
          </div>
        )}
        {isHost && status === GameStatus.ROOM_ASSIGNMENT && (
          <button onClick={handleStart} style={{ ...styles.button, ...styles.buttonEnabled }}>
            Start Game
          </button>
        )}
      </div>
    );
  }

  if (!isHost) {
    return (
      <div style={styles.container}>
        <h2>Waiting for Host</h2>
        <p>The host is selecting roles...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>Select Roles</h2>
        <p>
          Choose {requiredCount} roles ({selectedRoles.length}/{requiredCount})
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div style={styles.errors}>
          {validationErrors.map((error, i) => (
            <div key={i} style={styles.error}>
              {error}
            </div>
          ))}
        </div>
      )}

      <div style={styles.characterGrid}>
        {AVAILABLE_CHARACTERS.map((char) => {
          const selected = isRoleSelected(char.id);
          const required = isRoleRequired(char.id);

          return (
            <div
              key={char.id}
              onClick={() => toggleRole(char.id)}
              style={{
                ...styles.characterCard,
                ...(selected ? styles.characterCardSelected : {}),
                ...(required ? styles.characterCardRequired : {}),
                cursor: required && selected ? 'not-allowed' : 'pointer'
              }}
            >
              <div style={styles.characterName}>{char.name}</div>
              <div style={styles.characterTeam}>{char.team}</div>
              {required && <div style={styles.requiredBadge}>REQUIRED</div>}
            </div>
          );
        })}
      </div>

      <div style={styles.actions}>
        <button
          onClick={handleConfirm}
          disabled={validationErrors.length > 0}
          style={{
            ...styles.button,
            ...(validationErrors.length === 0
              ? styles.buttonEnabled
              : styles.buttonDisabled)
          }}
        >
          Confirm Roles
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '20px'
  },
  errors: {
    backgroundColor: '#ffe0e0',
    border: '1px solid #ff6b6b',
    borderRadius: '5px',
    padding: '15px',
    marginBottom: '20px'
  },
  error: {
    color: '#d32f2f',
    marginBottom: '5px'
  },
  characterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
    marginBottom: '20px'
  },
  characterCard: {
    padding: '15px',
    border: '2px solid #ccc',
    borderRadius: '5px',
    textAlign: 'center' as const,
    transition: 'all 0.3s',
    position: 'relative' as const
  },
  characterCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9'
  },
  characterCardRequired: {
    borderColor: '#2196F3',
    backgroundColor: '#e3f2fd'
  },
  characterName: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  characterTeam: {
    fontSize: '12px',
    color: '#666'
  },
  requiredBadge: {
    position: 'absolute' as const,
    top: '5px',
    right: '5px',
    fontSize: '10px',
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '2px 5px',
    borderRadius: '3px'
  },
  roleCard: {
    backgroundColor: '#f0f0f0',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginTop: '20px'
  },
  roleName: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  actions: {
    textAlign: 'center' as const
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
  }
};
