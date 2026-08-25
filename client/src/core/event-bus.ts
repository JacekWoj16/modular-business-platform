type EventHandler<T = unknown> = (payload: T) => void;

/**
 * Namespaced pub/sub bus for inter-panel communication. Modules never import
 * each other; they emit and listen on `module.event_name` strings instead.
 * See docs/architecture.md for the event catalog.
 */
class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  emit<T = unknown>(event: string, payload?: T): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }

  /** Subscribes to an event. Returns an unsubscribe function. */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);
    return () => this.off(event, handler as EventHandler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }
}

// Singleton export — every module imports this same instance.
export const eventBus = new EventBus();
