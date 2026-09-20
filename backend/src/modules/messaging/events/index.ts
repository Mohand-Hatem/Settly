import type { WebSocket } from "ws";
import { logger } from "../../../shared/logger/index.js";

// Map of userId -> Set of active WebSocket connections (a user may have multiple tabs)
const userSockets = new Map<string, Set<WebSocket>>();

export function registerSocket(userId: string, socket: WebSocket): void {
  let sockets = userSockets.get(userId);
  if (!sockets) {
    sockets = new Set<WebSocket>();
    userSockets.set(userId, sockets);
  }
  sockets.add(socket);
  logger.info({ userId, connectionCount: sockets.size }, "Chat WebSocket client registered");
}

export function unregisterSocket(userId: string, socket: WebSocket): void {
  const sockets = userSockets.get(userId);
  if (sockets) {
    sockets.delete(socket);
    if (sockets.size === 0) {
      userSockets.delete(userId);
    }
  }
  logger.info({ userId }, "Chat WebSocket client unregistered");
}

export function broadcastToUser(userId: string, event: { type: string; [key: string]: unknown }): void {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    return;
  }

  const payload = JSON.stringify(event);
  for (const socket of sockets) {
    if (socket.readyState === 1 /* OPEN */) {
      try {
        socket.send(payload);
      } catch (err) {
        logger.warn({ userId, err }, "Failed to send WebSocket message to client");
      }
    }
  }
}

export function broadcastToParticipants(
  userIds: string[],
  event: { type: string; [key: string]: unknown }
): void {
  for (const userId of userIds) {
    broadcastToUser(userId, event);
  }
}
