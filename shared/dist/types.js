/**
 * Shared Types for Two Rooms and a Boom
 *
 * These types are used by both client and server to ensure type safety
 * across the entire application.
 */
// ============================================================================
// GAME STATUS & STATES
// ============================================================================
export var GameStatus;
(function (GameStatus) {
    GameStatus["LOBBY"] = "LOBBY";
    GameStatus["LOCKED"] = "LOCKED";
    GameStatus["ROLE_SELECTION"] = "ROLE_SELECTION";
    GameStatus["ROLE_DISTRIBUTION"] = "ROLE_DISTRIBUTION";
    GameStatus["ROOM_ASSIGNMENT"] = "ROOM_ASSIGNMENT";
    GameStatus["ROUND_1"] = "ROUND_1";
    GameStatus["ROUND_2"] = "ROUND_2";
    GameStatus["ROUND_3"] = "ROUND_3";
    GameStatus["ROUND_4"] = "ROUND_4";
    GameStatus["ROUND_5"] = "ROUND_5";
    GameStatus["RESOLUTION"] = "RESOLUTION";
    GameStatus["FINISHED"] = "FINISHED";
})(GameStatus || (GameStatus = {}));
export var RoomId;
(function (RoomId) {
    RoomId["ROOM_A"] = "ROOM_A";
    RoomId["ROOM_B"] = "ROOM_B";
})(RoomId || (RoomId = {}));
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus["CONNECTED"] = "CONNECTED";
    ConnectionStatus["DISCONNECTED"] = "DISCONNECTED";
    ConnectionStatus["RECONNECTING"] = "RECONNECTING";
})(ConnectionStatus || (ConnectionStatus = {}));
// ============================================================================
// TEAMS & CHARACTERS
// ============================================================================
export var TeamColor;
(function (TeamColor) {
    TeamColor["BLUE"] = "BLUE";
    TeamColor["RED"] = "RED";
    TeamColor["GREY"] = "GREY";
    TeamColor["GREEN"] = "GREEN";
    TeamColor["PURPLE"] = "PURPLE";
    TeamColor["BLACK"] = "BLACK";
    TeamColor["PINK"] = "PINK";
})(TeamColor || (TeamColor = {}));
export var CharacterClass;
(function (CharacterClass) {
    CharacterClass["PRIMARY"] = "PRIMARY";
    CharacterClass["BACKUP"] = "BACKUP";
    CharacterClass["REGULAR"] = "REGULAR";
})(CharacterClass || (CharacterClass = {}));
// ============================================================================
// ABILITIES
// ============================================================================
export var AbilityTrigger;
(function (AbilityTrigger) {
    // Timing triggers
    AbilityTrigger["GAME_START"] = "GAME_START";
    AbilityTrigger["ROUND_START"] = "ROUND_START";
    AbilityTrigger["ROUND_END"] = "ROUND_END";
    AbilityTrigger["GAME_END"] = "GAME_END";
    // Action triggers
    AbilityTrigger["ON_CARD_SHARE_INITIATED"] = "ON_CARD_SHARE_INITIATED";
    AbilityTrigger["ON_CARD_SHARE_RECEIVED"] = "ON_CARD_SHARE_RECEIVED";
    AbilityTrigger["ON_COLOR_SHARE_INITIATED"] = "ON_COLOR_SHARE_INITIATED";
    AbilityTrigger["ON_COLOR_SHARE_RECEIVED"] = "ON_COLOR_SHARE_RECEIVED";
    AbilityTrigger["ON_PRIVATE_REVEAL"] = "ON_PRIVATE_REVEAL";
    AbilityTrigger["ON_BECOME_HOSTAGE"] = "ON_BECOME_HOSTAGE";
    AbilityTrigger["ON_VOTE_CAST"] = "ON_VOTE_CAST";
    // Manual triggers
    AbilityTrigger["MANUAL"] = "MANUAL";
})(AbilityTrigger || (AbilityTrigger = {}));
export var AbilityEffect;
(function (AbilityEffect) {
    // Information effects
    AbilityEffect["FORCE_CARD_SHARE"] = "FORCE_CARD_SHARE";
    AbilityEffect["FORCE_COLOR_SHARE"] = "FORCE_COLOR_SHARE";
    AbilityEffect["FORCE_PRIVATE_REVEAL"] = "FORCE_PRIVATE_REVEAL";
    AbilityEffect["STEAL_CARD"] = "STEAL_CARD";
    AbilityEffect["SWAP_CARD"] = "SWAP_CARD";
    // Condition effects
    AbilityEffect["APPLY_CONDITION"] = "APPLY_CONDITION";
    AbilityEffect["REMOVE_CONDITION"] = "REMOVE_CONDITION";
    AbilityEffect["REMOVE_ALL_CONDITIONS"] = "REMOVE_ALL_CONDITIONS";
    // Movement effects
    AbilityEffect["FORCE_HOSTAGE"] = "FORCE_HOSTAGE";
    AbilityEffect["PREVENT_HOSTAGE"] = "PREVENT_HOSTAGE";
    AbilityEffect["FORCE_ROOM_CHANGE"] = "FORCE_ROOM_CHANGE";
    AbilityEffect["PREVENT_ROOM_CHANGE"] = "PREVENT_ROOM_CHANGE";
    // Team effects
    AbilityEffect["CHANGE_TEAM"] = "CHANGE_TEAM";
    // Game effects
    AbilityEffect["END_ROUND_EARLY"] = "END_ROUND_EARLY";
    AbilityEffect["INSTANT_WIN"] = "INSTANT_WIN";
    AbilityEffect["INSTANT_LOSE"] = "INSTANT_LOSE";
    // Special
    AbilityEffect["REMOVE_FROM_GAME"] = "REMOVE_FROM_GAME";
    AbilityEffect["CUSTOM"] = "CUSTOM";
})(AbilityEffect || (AbilityEffect = {}));
export var TargetingType;
(function (TargetingType) {
    TargetingType["SELF"] = "SELF";
    TargetingType["SINGLE_PLAYER"] = "SINGLE_PLAYER";
    TargetingType["MULTIPLE_PLAYERS"] = "MULTIPLE_PLAYERS";
    TargetingType["ALL_IN_ROOM"] = "ALL_IN_ROOM";
    TargetingType["ALL_PLAYERS"] = "ALL_PLAYERS";
    TargetingType["CARD_SHARE_PARTNER"] = "CARD_SHARE_PARTNER";
})(TargetingType || (TargetingType = {}));
// ============================================================================
// CONDITIONS
// ============================================================================
export var ConditionType;
(function (ConditionType) {
    ConditionType["HONEST"] = "HONEST";
    ConditionType["ATTACHED"] = "ATTACHED";
    ConditionType["TRAITOR"] = "TRAITOR";
    ConditionType["CURSED"] = "CURSED";
    ConditionType["SILENCED"] = "SILENCED";
    ConditionType["INFECTED"] = "INFECTED";
    ConditionType["TOAST"] = "TOAST";
    ConditionType["IN_LOVE"] = "IN_LOVE";
    ConditionType["CULT"] = "CULT";
})(ConditionType || (ConditionType = {}));
// ============================================================================
// WIN CONDITIONS
// ============================================================================
export var WinConditionType;
(function (WinConditionType) {
    WinConditionType["TEAM_WINS"] = "TEAM_WINS";
    WinConditionType["WITH_CHARACTERS"] = "WITH_CHARACTERS";
    WinConditionType["NOT_WITH_CHARACTERS"] = "NOT_WITH_CHARACTERS";
    WinConditionType["CARD_SHARED_WITH"] = "CARD_SHARED_WITH";
    WinConditionType["NOT_CARD_SHARED_WITH"] = "NOT_CARD_SHARED_WITH";
    WinConditionType["IS_LEADER"] = "IS_LEADER";
    WinConditionType["SURVIVED"] = "SURVIVED";
    WinConditionType["NEVER_SENT_AS_HOSTAGE"] = "NEVER_SENT_AS_HOSTAGE";
    WinConditionType["CORRECT_GUESS"] = "CORRECT_GUESS";
    WinConditionType["MOST_USURP_VOTES"] = "MOST_USURP_VOTES";
    WinConditionType["CUSTOM"] = "CUSTOM";
})(WinConditionType || (WinConditionType = {}));
// ============================================================================
// ROUND
// ============================================================================
export var RoundStatus;
(function (RoundStatus) {
    RoundStatus["PENDING"] = "PENDING";
    RoundStatus["LEADER_SELECTION"] = "LEADER_SELECTION";
    RoundStatus["ACTIVE"] = "ACTIVE";
    RoundStatus["HOSTAGE_SELECTION"] = "HOSTAGE_SELECTION";
    RoundStatus["PARLAY"] = "PARLAY";
    RoundStatus["HOSTAGE_EXCHANGE"] = "HOSTAGE_EXCHANGE";
    RoundStatus["COMPLETE"] = "COMPLETE";
})(RoundStatus || (RoundStatus = {}));
export var RoundEventType;
(function (RoundEventType) {
    RoundEventType["LEADER_NOMINATED"] = "LEADER_NOMINATED";
    RoundEventType["LEADER_ELECTED"] = "LEADER_ELECTED";
    RoundEventType["LEADER_ABDICATED"] = "LEADER_ABDICATED";
    RoundEventType["LEADER_USURPED"] = "LEADER_USURPED";
    RoundEventType["VOTE_CAST"] = "VOTE_CAST";
    RoundEventType["HOSTAGE_SELECTED"] = "HOSTAGE_SELECTED";
    RoundEventType["HOSTAGE_LOCKED"] = "HOSTAGE_LOCKED";
    RoundEventType["PARLAY_STARTED"] = "PARLAY_STARTED";
    RoundEventType["PARLAY_ENDED"] = "PARLAY_ENDED";
    RoundEventType["HOSTAGE_EXCHANGED"] = "HOSTAGE_EXCHANGED";
    RoundEventType["ABILITY_ACTIVATED"] = "ABILITY_ACTIVATED";
    RoundEventType["CARD_SHARED"] = "CARD_SHARED";
    RoundEventType["COLOR_SHARED"] = "COLOR_SHARED";
    RoundEventType["ROUND_ENDED_EARLY"] = "ROUND_ENDED_EARLY";
})(RoundEventType || (RoundEventType = {}));
// ============================================================================
// ACTIONS (Client -> Server)
// ============================================================================
export var ClientActionType;
(function (ClientActionType) {
    // Lobby actions
    ClientActionType["CREATE_GAME"] = "CREATE_GAME";
    ClientActionType["JOIN_GAME"] = "JOIN_GAME";
    ClientActionType["LEAVE_GAME"] = "LEAVE_GAME";
    ClientActionType["LOCK_ROOM"] = "LOCK_ROOM";
    ClientActionType["UNLOCK_ROOM"] = "UNLOCK_ROOM";
    // Role selection
    ClientActionType["SELECT_ROLES"] = "SELECT_ROLES";
    ClientActionType["SET_ROUNDS"] = "SET_ROUNDS";
    ClientActionType["CONFIRM_ROLES"] = "CONFIRM_ROLES";
    // Game actions
    ClientActionType["START_GAME"] = "START_GAME";
    ClientActionType["NOMINATE_LEADER"] = "NOMINATE_LEADER";
    ClientActionType["INITIATE_NEW_LEADER_VOTE"] = "INITIATE_NEW_LEADER_VOTE";
    ClientActionType["VOTE_USURP"] = "VOTE_USURP";
    ClientActionType["ABDICATE"] = "ABDICATE";
    ClientActionType["SELECT_HOSTAGE"] = "SELECT_HOSTAGE";
    ClientActionType["LOCK_HOSTAGES"] = "LOCK_HOSTAGES";
    // Card sharing
    ClientActionType["CARD_SHARE"] = "CARD_SHARE";
    ClientActionType["COLOR_SHARE"] = "COLOR_SHARE";
    ClientActionType["PRIVATE_REVEAL"] = "PRIVATE_REVEAL";
    ClientActionType["PUBLIC_REVEAL"] = "PUBLIC_REVEAL";
    // Abilities
    ClientActionType["ACTIVATE_ABILITY"] = "ACTIVATE_ABILITY";
})(ClientActionType || (ClientActionType = {}));
// ============================================================================
// SERVER EVENTS (Server -> Client)
// ============================================================================
export var ServerEventType;
(function (ServerEventType) {
    // Connection events
    ServerEventType["CONNECTED"] = "CONNECTED";
    ServerEventType["DISCONNECTED"] = "DISCONNECTED";
    ServerEventType["ERROR"] = "ERROR";
    // Game state events
    ServerEventType["GAME_CREATED"] = "GAME_CREATED";
    ServerEventType["PLAYER_JOINED"] = "PLAYER_JOINED";
    ServerEventType["PLAYER_LEFT"] = "PLAYER_LEFT";
    ServerEventType["PLAYER_DISCONNECTED"] = "PLAYER_DISCONNECTED";
    ServerEventType["PLAYER_RECONNECTED"] = "PLAYER_RECONNECTED";
    ServerEventType["PLAYER_REMOVED"] = "PLAYER_REMOVED";
    ServerEventType["ROOM_LOCKED"] = "ROOM_LOCKED";
    ServerEventType["ROOM_UNLOCKED"] = "ROOM_UNLOCKED";
    // Role selection
    ServerEventType["ROLES_SELECTED"] = "ROLES_SELECTED";
    ServerEventType["ROLE_ASSIGNED"] = "ROLE_ASSIGNED";
    ServerEventType["GAME_CONFIG_UPDATED"] = "GAME_CONFIG_UPDATED";
    // Round events
    ServerEventType["ROUND_STARTED"] = "ROUND_STARTED";
    ServerEventType["ROUND_ENDED"] = "ROUND_ENDED";
    ServerEventType["TIMER_UPDATE"] = "TIMER_UPDATE";
    // Leader events
    ServerEventType["LEADER_NOMINATED"] = "LEADER_NOMINATED";
    ServerEventType["LEADER_ELECTED"] = "LEADER_ELECTED";
    ServerEventType["LEADER_USURPED"] = "LEADER_USURPED";
    ServerEventType["LEADER_ABDICATED"] = "LEADER_ABDICATED";
    ServerEventType["LEADER_DISCONNECTED"] = "LEADER_DISCONNECTED";
    ServerEventType["VOTE_CAST"] = "VOTE_CAST";
    // Hostage events
    ServerEventType["HOSTAGE_SELECTED"] = "HOSTAGE_SELECTED";
    ServerEventType["HOSTAGES_LOCKED"] = "HOSTAGES_LOCKED";
    ServerEventType["PARLAY_STARTED"] = "PARLAY_STARTED";
    ServerEventType["PARLAY_ENDED"] = "PARLAY_ENDED";
    ServerEventType["HOSTAGES_EXCHANGED"] = "HOSTAGES_EXCHANGED";
    // Ability events
    ServerEventType["ABILITY_ACTIVATED"] = "ABILITY_ACTIVATED";
    ServerEventType["CONDITION_APPLIED"] = "CONDITION_APPLIED";
    ServerEventType["CONDITION_REMOVED"] = "CONDITION_REMOVED";
    // Game flow
    ServerEventType["GAME_PAUSED"] = "GAME_PAUSED";
    ServerEventType["GAME_RESUMED"] = "GAME_RESUMED";
    ServerEventType["GAME_FINISHED"] = "GAME_FINISHED";
    // Sync events
    ServerEventType["STATE_SYNC"] = "STATE_SYNC";
    ServerEventType["DESYNC_DETECTED"] = "DESYNC_DETECTED";
})(ServerEventType || (ServerEventType = {}));
