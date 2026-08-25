import { useEffect, useRef } from 'react';
import { eventBus } from '../core/event-bus';

/**
 * Subscribes to an event-bus event for the lifetime of the component.
 * Always unsubscribes on unmount, so a panel that gets closed never leaks a
 * listener. The handler is kept in a ref so callers can pass an inline
 * arrow function without re-subscribing on every render.
 */
export function useEventBus<T = unknown>(event: string, handler: (payload: T) => void): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return eventBus.on<T>(event, (payload) => handlerRef.current(payload));
  }, [event]);
}
