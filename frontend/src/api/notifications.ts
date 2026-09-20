import { api } from "./client";
import { unwrap } from "./errors";
import type { components } from "./v1.d.ts";

export type NotificationDto = components["schemas"]["NotificationDto"];
export type NotificationCategory = NotificationDto["category"];
export type NotificationListResponse = components["schemas"]["NotificationListResponse"];
export type UnreadCountResponse = components["schemas"]["UnreadCountResponse"];

export interface NotificationQueryOptions {
  unreadOnly?: boolean;
  cursor?: string;
  limit?: number;
}

export async function fetchNotifications(
  options?: NotificationQueryOptions,
  signal?: AbortSignal
): Promise<NotificationListResponse> {
  return unwrap(
    await api.GET("/api/v1/notifications", {
      params: {
        query: {
          unreadOnly: options?.unreadOnly ? "true" : undefined,
          cursor: options?.cursor,
          limit: options?.limit,
        },
      },
      signal,
    })
  );
}

export async function fetchUnreadNotificationCount(signal?: AbortSignal): Promise<UnreadCountResponse> {
  return unwrap(
    await api.GET("/api/v1/notifications/unread-count", {
      signal,
    })
  );
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  return unwrap(
    await api.PATCH("/api/v1/notifications/{id}/read", {
      params: { path: { id } },
    })
  );
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; count?: number }> {
  return unwrap(
    await api.POST("/api/v1/notifications/mark-all-read")
  );
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  return unwrap(
    await api.DELETE("/api/v1/notifications/{id}", {
      params: { path: { id } },
    })
  );
}
