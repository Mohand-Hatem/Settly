import { EventEmitter } from "node:events";
import { logger } from "../logger/index.js";

/**
 * In-process domain event bus. Lets one module react to another module's committed changes
 * without a circular service import. Events are emitted AFTER the transaction commits
 * (CONCURRENCY_AND_IDEMPOTENCY.md §8); listeners must be idempotent.
 */
export interface DomainEvents {
  "property.statusChanged": { propertyId: string; from: string; to: string };
}

const emitter = new EventEmitter();

export function publish<K extends keyof DomainEvents>(name: K, payload: DomainEvents[K]): void {
  emitter.emit(name, payload);
}

export function subscribe<K extends keyof DomainEvents>(
  name: K,
  handler: (payload: DomainEvents[K]) => Promise<void> | void
): void {
  emitter.on(name, (payload: DomainEvents[K]) => {
    Promise.resolve()
      .then(() => handler(payload))
      .catch((err) => logger.error({ err, event: name }, "Domain event handler failed"));
  });
}
