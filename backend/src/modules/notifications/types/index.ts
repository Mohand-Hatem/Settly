export type NotificationCategory = "DEALS" | "VIEWINGS" | "MESSAGES" | "SYSTEM";

export type NotificationType =
  | "VIEWING_REQUESTED"
  | "VIEWING_CONFIRMED"
  | "VIEWING_DECLINED"
  | "VIEWING_CANCELLED"
  | "OFFER_SUBMITTED"
  | "OFFER_COUNTERED"
  | "OFFER_ACCEPTED"
  | "OFFER_REJECTED"
  | "OFFER_WITHDRAWN"
  | "OFFER_SUPERSEDED"
  | "DEPOSIT_CONFIRMED"
  | "DEPOSIT_SUPERSEDED"
  | "DEPOSIT_DEADLINE_APPROACHING"
  | "NEW_MESSAGE"
  | "SYSTEM_NOTICE";

export interface NotificationDto {
  id: string;
  type: string;
  category: NotificationCategory;
  title: string;
  body: string;
  actionUrl: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  params: Record<string, unknown>;
}

export interface NotificationListResponse {
  items: NotificationDto[];
  unreadCount: number;
  totalCount: number;
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  params: Record<string, unknown>;
  sendEmail?: boolean;
}

export interface ListNotificationsOptions {
  userId: string;
  unreadOnly?: boolean;
  category?: NotificationCategory;
  cursor?: string;
  limit?: number;
}
