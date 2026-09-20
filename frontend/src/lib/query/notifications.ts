"use client";

import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/api/notifications";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unreadOnly?: boolean) =>
    [...notificationKeys.all, "list", { unreadOnly: Boolean(unreadOnly) }] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

export const notificationsListQuery = (unreadOnly?: boolean) =>
  queryOptions({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ signal }) => fetchNotifications({ unreadOnly }, signal),
    refetchInterval: 20_000,
  });

export const unreadNotificationCountQuery = () =>
  queryOptions({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) => fetchUnreadNotificationCount(signal),
    refetchInterval: 15_000,
  });

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
