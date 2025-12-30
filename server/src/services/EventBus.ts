/**
 * Event Bus
 *
 * Scoped event broadcasting system for real-time game state synchronization.
 * Ensures players only receive information they should see.
 */

import { RoomId, ServerEventType } from '@two-rooms/shared';
import { EventScope, GameEvent } from '../core/GameState';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// EVENT LISTENER
// ============================================================================

export type EventListener = (event: GameEvent) => void;

interface Subscription {
  id: string;
  gameId: string;
  playerId?: string;
  listener: EventListener;
}

// ============================================================================
// EVENT BUS
// ============================================================================

export class EventBus {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private eventLog: Map<string, GameEvent[]> = new Map();
  private sequenceNumbers: Map<string, number> = new Map();

  /**
   * Subscribe to events for a specific game
   */
  subscribe(
    gameId: string,
    listener: EventListener,
    playerId?: string
  ): string {
    const subscriptionId = uuidv4();

    const subscription: Subscription = {
      id: subscriptionId,
      gameId,
      playerId,
      listener
    };

    const subs = this.subscriptions.get(gameId) || [];
    subs.push(subscription);
    this.subscriptions.set(gameId, subs);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): void {
    for (const [gameId, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length === 0) {
        this.subscriptions.delete(gameId);
      } else {
        this.subscriptions.set(gameId, filtered);
      }
    }
  }

  /**
   * Broadcast an event with scoped delivery
   */
  broadcast(
    gameId: string,
    type: ServerEventType | string,
    payload: any,
    scope: EventScope = 'PUBLIC'
  ): void {
    // Create event
    const event = this.createEvent(gameId, type, payload, scope);

    // Store in event log
    this.logEvent(gameId, event);

    // Get subscribers
    const subscriptions = this.subscriptions.get(gameId) || [];

    // Deliver to appropriate subscribers based on scope
    for (const subscription of subscriptions) {
      if (this.shouldReceiveEvent(subscription, scope)) {
        try {
          subscription.listener(event);
        } catch (error) {
          console.error(
            `Error delivering event to subscriber ${subscription.id}:`,
            error
          );
        }
      }
    }
  }

  /**
   * Broadcast to a specific player
   */
  broadcastToPlayer(
    gameId: string,
    playerId: string,
    type: ServerEventType | string,
    payload: any
  ): void {
    this.broadcast(gameId, type, payload, { playerId });
  }

  /**
   * Broadcast to a specific room
   */
  broadcastToRoom(
    gameId: string,
    roomId: RoomId,
    type: ServerEventType | string,
    payload: any
  ): void {
    this.broadcast(gameId, type, payload, roomId);
  }

  /**
   * Get events since a specific sequence number (for reconnection)
   */
  getEventsSince(gameId: string, sequenceNumber: number): GameEvent[] {
    const events = this.eventLog.get(gameId) || [];
    return events.filter((e) => e.sequenceNumber > sequenceNumber);
  }

  /**
   * Get all events for a game
   */
  getEvents(gameId: string): GameEvent[] {
    return this.eventLog.get(gameId) || [];
  }

  /**
   * Clear event log for a game (when game finishes)
   */
  clearEvents(gameId: string): void {
    this.eventLog.delete(gameId);
    this.sequenceNumbers.delete(gameId);
  }

  /**
   * Create an event
   */
  private createEvent(
    gameId: string,
    type: string,
    payload: any,
    scope: EventScope
  ): GameEvent {
    const sequenceNumber = this.getNextSequenceNumber(gameId);

    return {
      eventId: uuidv4(),
      sequenceNumber,
      type,
      scope,
      payload,
      timestamp: Date.now()
    };
  }

  /**
   * Get next sequence number for a game
   */
  private getNextSequenceNumber(gameId: string): number {
    const current = this.sequenceNumbers.get(gameId) || 0;
    const next = current + 1;
    this.sequenceNumbers.set(gameId, next);
    return next;
  }

  /**
   * Log event
   */
  private logEvent(gameId: string, event: GameEvent): void {
    const events = this.eventLog.get(gameId) || [];
    events.push(event);
    this.eventLog.set(gameId, events);

    // Optional: Limit event log size (keep last 1000 events)
    if (events.length > 1000) {
      events.shift();
    }
  }

  /**
   * Determine if a subscription should receive an event based on scope
   */
  private shouldReceiveEvent(
    subscription: Subscription,
    scope: EventScope
  ): boolean {
    // PUBLIC events go to everyone
    if (scope === 'PUBLIC') {
      return true;
    }

    // Player-specific events
    if (typeof scope === 'object' && 'playerId' in scope) {
      return subscription.playerId === scope.playerId;
    }

    // Room-specific events
    if (scope === RoomId.ROOM_A || scope === RoomId.ROOM_B) {
      // TODO: Check if player is in this room
      // For now, we'll need to pass room membership info
      // This will be handled by a higher-level service
      return true;
    }

    return false;
  }

  /**
   * Get subscription count for a game
   */
  getSubscriberCount(gameId: string): number {
    return (this.subscriptions.get(gameId) || []).length;
  }

  /**
   * Check if a player is subscribed
   */
  isPlayerSubscribed(gameId: string, playerId: string): boolean {
    const subs = this.subscriptions.get(gameId) || [];
    return subs.some((s) => s.playerId === playerId);
  }
}

// Singleton instance
export const eventBus = new EventBus();
