/**
 * Validation Engine
 *
 * Multi-phase validation system for game rules, actions, and configurations.
 */

import {
  CharacterId,
  ValidationError,
  ValidationResult,
  ClientActionType,
  RoomId
} from '@two-rooms/shared';
import { Game, Player } from '../core/GameState';
import { characterLoader } from '../services/CharacterLoader';

// ============================================================================
// VALIDATION PHASES
// ============================================================================

export enum ValidationPhase {
  ROOM_LOCK = 'ROOM_LOCK',
  ROLE_CONFIGURATION = 'ROLE_CONFIGURATION',
  ROLE_DISTRIBUTION = 'ROLE_DISTRIBUTION',
  ROOM_ASSIGNMENT = 'ROOM_ASSIGNMENT',
  ACTION_REQUEST = 'ACTION_REQUEST',
  ABILITY_ACTIVATION = 'ABILITY_ACTIVATION',
  WIN_CONDITION = 'WIN_CONDITION'
}

// ============================================================================
// VALIDATION CONTEXT
// ============================================================================

export interface ValidationContext {
  game: Game;
  phase: ValidationPhase;
  player?: Player;
  action?: any;
  roles?: CharacterId[];
  playerCount?: number;
  buryCard?: boolean;
  [key: string]: any;
}

// ============================================================================
// VALIDATORS
// ============================================================================

interface Validator {
  phase: ValidationPhase;
  validate(context: ValidationContext): ValidationResult;
}

// ============================================================================
// PLAYER COUNT VALIDATOR
// ============================================================================

class PlayerCountValidator implements Validator {
  phase = ValidationPhase.ROOM_LOCK;

  validate(context: ValidationContext): ValidationResult {
    const playerCount = context.game.players.size;
    const errors: ValidationError[] = [];

    if (playerCount < 6) {
      errors.push({
        code: 'INSUFFICIENT_PLAYERS',
        message: `Need at least 6 players to start, currently have ${playerCount}`,
        severity: 'ERROR',
        suggestion: 'Wait for more players to join before locking the room'
      });
    }

    if (playerCount > 30) {
      errors.push({
        code: 'TOO_MANY_PLAYERS',
        message: `Maximum 30 players allowed, currently have ${playerCount}`,
        severity: 'ERROR',
        suggestion: 'Remove players before locking the room'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// ============================================================================
// ROLE CONFIGURATION VALIDATOR
// ============================================================================

class RoleConfigurationValidator implements Validator {
  phase = ValidationPhase.ROLE_CONFIGURATION;

  validate(context: ValidationContext): ValidationResult {
    const { roles, playerCount, buryCard } = context;
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!roles || !playerCount) {
      errors.push({
        code: 'MISSING_CONTEXT',
        message: 'Missing roles or playerCount in validation context',
        severity: 'ERROR'
      });
      return { valid: false, errors };
    }

    // Check required characters
    if (!roles.includes('president')) {
      errors.push({
        code: 'MISSING_PRESIDENT',
        message: 'President is required in every game',
        severity: 'ERROR',
        suggestion: 'Add the President card to your role selection'
      });
    }

    if (!roles.includes('bomber')) {
      errors.push({
        code: 'MISSING_BOMBER',
        message: 'Bomber is required in every game',
        severity: 'ERROR',
        suggestion: 'Add the Bomber card to your role selection'
      });
    }

    // Check count
    const expectedCount = buryCard ? playerCount - 1 : playerCount;
    if (roles.length !== expectedCount) {
      errors.push({
        code: 'ROLE_COUNT_MISMATCH',
        message: `Need ${expectedCount} roles, but have ${roles.length}`,
        severity: 'ERROR',
        suggestion: buryCard
          ? `Select ${expectedCount} roles (${playerCount} players - 1 buried)`
          : `Select exactly ${expectedCount} roles to match player count`
      });
    }

    // Check dependencies
    const dependencyErrors = this.validateDependencies(roles);
    errors.push(...dependencyErrors);

    // Check mutual exclusions
    const exclusionErrors = this.validateMutualExclusions(roles);
    errors.push(...exclusionErrors);

    // Check team balance (warning only)
    const balanceWarnings = this.checkTeamBalance(roles);
    warnings.push(...balanceWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateDependencies(roles: CharacterId[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const roleId of roles) {
      const char = characterLoader.getCharacter(roleId);
      if (!char) {
        errors.push({
          code: 'UNKNOWN_CHARACTER',
          message: `Unknown character: ${roleId}`,
          severity: 'ERROR'
        });
        continue;
      }

      if (char.requires) {
        for (const requiredId of char.requires) {
          if (!roles.includes(requiredId)) {
            const requiredChar = characterLoader.getCharacter(requiredId);
            errors.push({
              code: 'MISSING_DEPENDENCY',
              message: `${char.name} requires ${requiredChar?.name || requiredId}`,
              severity: 'ERROR',
              context: { character: roleId, requires: requiredId },
              suggestion: `Add ${requiredChar?.name || requiredId} to the game or remove ${char.name}`
            });
          }
        }
      }
    }

    return errors;
  }

  private validateMutualExclusions(roles: CharacterId[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const roleId of roles) {
      const char = characterLoader.getCharacter(roleId);
      if (!char) continue;

      if (char.mutuallyExclusive) {
        for (const excludedId of char.mutuallyExclusive) {
          if (roles.includes(excludedId)) {
            const excludedChar = characterLoader.getCharacter(excludedId);
            errors.push({
              code: 'MUTUALLY_EXCLUSIVE',
              message: `${char.name} cannot be played with ${excludedChar?.name || excludedId}`,
              severity: 'ERROR',
              context: { character: roleId, conflictsWith: excludedId },
              suggestion: `Remove either ${char.name} or ${excludedChar?.name || excludedId}`
            });
          }
        }
      }
    }

    return errors;
  }

  private checkTeamBalance(roles: CharacterId[]): ValidationError[] {
    const warnings: ValidationError[] = [];
    const teamCounts: Record<string, number> = {};

    for (const roleId of roles) {
      const char = characterLoader.getCharacter(roleId);
      if (char) {
        teamCounts[char.team] = (teamCounts[char.team] || 0) + 1;
      }
    }

    const redCount = teamCounts['RED'] || 0;
    const blueCount = teamCounts['BLUE'] || 0;
    const diff = Math.abs(redCount - blueCount);

    if (diff > 2) {
      warnings.push({
        code: 'UNBALANCED_TEAMS',
        message: `Teams are unbalanced: ${redCount} Red vs ${blueCount} Blue (difference: ${diff})`,
        severity: 'WARNING',
        suggestion: 'Consider adding more characters to balance the teams'
      });
    }

    return warnings;
  }
}

// ============================================================================
// ACTION VALIDATOR
// ============================================================================

class ActionValidator implements Validator {
  phase = ValidationPhase.ACTION_REQUEST;

  validate(context: ValidationContext): ValidationResult {
    const { game, player, action } = context;
    const errors: ValidationError[] = [];

    if (!player || !action) {
      errors.push({
        code: 'MISSING_CONTEXT',
        message: 'Missing player or action in validation context',
        severity: 'ERROR'
      });
      return { valid: false, errors };
    }

    // Authorization check
    if (!this.isAuthorized(player, action, game)) {
      errors.push({
        code: 'UNAUTHORIZED',
        message: `Player ${player.name} is not authorized to perform ${action.type}`,
        severity: 'ERROR'
      });
    }

    // State check
    if (!this.isValidInCurrentState(action, game)) {
      errors.push({
        code: 'INVALID_STATE',
        message: `Cannot ${action.type} in current game state ${game.state.public.status}`,
        severity: 'ERROR'
      });
    }

    // Action-specific validation
    const specificErrors = this.validateActionSpecifics(action, player, game);
    errors.push(...specificErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private isAuthorized(player: Player, action: any, game: Game): boolean {
    switch (action.type) {
      case ClientActionType.LOCK_ROOM:
      case ClientActionType.UNLOCK_ROOM:
      case ClientActionType.SELECT_ROLES:
      case ClientActionType.CONFIRM_ROLES:
      case ClientActionType.START_GAME:
        return player.isHost;

      case ClientActionType.SELECT_HOSTAGE:
      case ClientActionType.LOCK_HOSTAGES:
        return player.isLeader;

      case ClientActionType.NOMINATE_LEADER:
      case ClientActionType.VOTE_USURP:
      case ClientActionType.ABDICATE:
      case ClientActionType.CARD_SHARE:
      case ClientActionType.COLOR_SHARE:
      case ClientActionType.PRIVATE_REVEAL:
      case ClientActionType.PUBLIC_REVEAL:
      case ClientActionType.ACTIVATE_ABILITY:
        return true; // All players can do these

      default:
        return false;
    }
  }

  private isValidInCurrentState(action: any, game: Game): boolean {
    const status = game.state.public.status;

    switch (action.type) {
      case ClientActionType.LOCK_ROOM:
        return status === 'LOBBY';

      case ClientActionType.UNLOCK_ROOM:
        return status === 'LOCKED';

      case ClientActionType.SELECT_ROLES:
      case ClientActionType.CONFIRM_ROLES:
        return status === 'ROLE_SELECTION' || status === 'LOCKED';

      case ClientActionType.START_GAME:
        return status === 'ROOM_ASSIGNMENT';

      case ClientActionType.NOMINATE_LEADER:
      case ClientActionType.VOTE_USURP:
      case ClientActionType.ABDICATE:
      case ClientActionType.SELECT_HOSTAGE:
      case ClientActionType.LOCK_HOSTAGES:
      case ClientActionType.CARD_SHARE:
      case ClientActionType.COLOR_SHARE:
      case ClientActionType.PRIVATE_REVEAL:
      case ClientActionType.ACTIVATE_ABILITY:
        return status.startsWith('ROUND_');

      default:
        return false;
    }
  }

  private validateActionSpecifics(
    action: any,
    player: Player,
    game: Game
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (action.type) {
      case ClientActionType.SELECT_HOSTAGE:
        errors.push(...this.validateHostageSelection(action, player, game));
        break;

      case ClientActionType.VOTE_USURP:
        errors.push(...this.validateLeaderVote(action, player, game));
        break;

      case ClientActionType.CARD_SHARE:
      case ClientActionType.COLOR_SHARE:
        errors.push(...this.validateCardShare(action, player, game));
        break;
    }

    return errors;
  }

  private validateHostageSelection(
    action: any,
    player: Player,
    game: Game
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Must be leader
    if (!player.isLeader) {
      errors.push({
        code: 'NOT_LEADER',
        message: 'Only leaders can select hostages',
        severity: 'ERROR'
      });
      return errors;
    }

    const targetPlayerId = action.payload?.targetPlayerId;
    if (!targetPlayerId) {
      errors.push({
        code: 'MISSING_TARGET',
        message: 'No target player specified',
        severity: 'ERROR'
      });
      return errors;
    }

    // Cannot select self
    if (targetPlayerId === player.id) {
      errors.push({
        code: 'INVALID_TARGET',
        message: 'Leaders cannot select themselves as hostages',
        severity: 'ERROR'
      });
    }

    // Must be in same room
    const targetPlayer = game.players.get(targetPlayerId);
    if (!targetPlayer) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Target player not found',
        severity: 'ERROR'
      });
      return errors;
    }

    if (targetPlayer.currentRoom !== player.currentRoom) {
      errors.push({
        code: 'WRONG_ROOM',
        message: 'Can only select hostages from your own room',
        severity: 'ERROR'
      });
    }

    // Check if hostage limit reached
    const room = game.state.rooms[player.currentRoom!];
    const currentRound = game.state.public.currentRound;
    const hostageCount = this.getHostageCount(game.players.size, currentRound);

    if (room.hostageCandidates.length >= hostageCount) {
      errors.push({
        code: 'HOSTAGE_LIMIT_REACHED',
        message: `Already selected ${hostageCount} hostages for this round`,
        severity: 'ERROR'
      });
    }

    return errors;
  }

  private validateLeaderVote(
    action: any,
    player: Player,
    game: Game
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const candidateId = action.payload?.candidateId;
    if (!candidateId) {
      errors.push({
        code: 'MISSING_CANDIDATE',
        message: 'No candidate specified for leadership vote',
        severity: 'ERROR'
      });
      return errors;
    }

    // Must be in same room
    const candidate = game.players.get(candidateId);
    if (!candidate) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Candidate not found',
        severity: 'ERROR'
      });
      return errors;
    }

    if (candidate.currentRoom !== player.currentRoom) {
      errors.push({
        code: 'WRONG_ROOM',
        message: 'Can only vote for players in your room',
        severity: 'ERROR'
      });
    }

    return errors;
  }

  private validateCardShare(
    action: any,
    player: Player,
    game: Game
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    const targetPlayerId = action.payload?.targetPlayerId;
    if (!targetPlayerId) {
      errors.push({
        code: 'MISSING_TARGET',
        message: 'No target player specified for card share',
        severity: 'ERROR'
      });
      return errors;
    }

    const targetPlayer = game.players.get(targetPlayerId);
    if (!targetPlayer) {
      errors.push({
        code: 'PLAYER_NOT_FOUND',
        message: 'Target player not found',
        severity: 'ERROR'
      });
      return errors;
    }

    // Must be in same room
    if (targetPlayer.currentRoom !== player.currentRoom) {
      errors.push({
        code: 'WRONG_ROOM',
        message: 'Can only share cards with players in your room',
        severity: 'ERROR'
      });
    }

    return errors;
  }

  private getHostageCount(playerCount: number, roundNumber: number): number {
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
  }
}

// ============================================================================
// VALIDATION ENGINE
// ============================================================================

export class ValidationEngine {
  private validators: Map<ValidationPhase, Validator[]> = new Map();

  constructor() {
    this.registerDefaultValidators();
  }

  /**
   * Register default validators
   */
  private registerDefaultValidators(): void {
    this.registerValidator(new PlayerCountValidator());
    this.registerValidator(new RoleConfigurationValidator());
    this.registerValidator(new ActionValidator());
  }

  /**
   * Register a custom validator
   */
  registerValidator(validator: Validator): void {
    const validators = this.validators.get(validator.phase) || [];
    validators.push(validator);
    this.validators.set(validator.phase, validators);
  }

  /**
   * Validate a context
   */
  validate(context: ValidationContext): ValidationResult {
    const validators = this.validators.get(context.phase) || [];
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationError[] = [];

    for (const validator of validators) {
      const result = validator.validate(context);
      allErrors.push(...result.errors);
      if (result.warnings) {
        allWarnings.push(...result.warnings);
      }
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Validate role configuration
   */
  validateRoleConfiguration(
    roles: CharacterId[],
    playerCount: number,
    buryCard: boolean = false
  ): ValidationResult {
    return this.validate({
      game: null as any, // Not needed for role validation
      phase: ValidationPhase.ROLE_CONFIGURATION,
      roles,
      playerCount,
      buryCard
    });
  }

  /**
   * Validate player action
   */
  validateAction(game: Game, player: Player, action: any): ValidationResult {
    return this.validate({
      game,
      phase: ValidationPhase.ACTION_REQUEST,
      player,
      action
    });
  }
}
