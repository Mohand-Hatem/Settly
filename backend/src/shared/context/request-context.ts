import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  userId?: string;
  dbQueryCount?: number;
  dbTimeMs?: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

export function getUserId(): string | undefined {
  return requestContext.getStore()?.userId;
}
