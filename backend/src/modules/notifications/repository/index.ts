import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";
import type { Prisma } from "@prisma/client";

export interface CreateNotificationParams {
  userId: string;
  type: string;
  params: Record<string, unknown>;
  channelsDelivered?: Record<string, unknown>;
}

export class NotificationRepository {
  async listUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      cursor?: string;
      limit?: number;
    }
  ) {
    const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(options?.unreadOnly ? { isRead: false } : {}),
    };

    const items = await prisma.notification.findMany({
      where,
      take: limit + 1,
      cursor: options?.cursor ? { id: options.cursor } : undefined,
      skip: options?.cursor ? 1 : 0,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id ?? null;
    }

    return { items, nextCursor };
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async countTotal(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(id: string, userId: string) {
    return prisma.notification.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async createNotification(
    data: CreateNotificationParams,
    tx?: Prisma.TransactionClient
  ) {
    const db = tx ?? prisma;
    return db.notification.create({
      data: {
        id: uuidv7(),
        userId: data.userId,
        type: data.type,
        params: data.params as Prisma.InputJsonValue,
        channelsDelivered: data.channelsDelivered as Prisma.InputJsonValue | undefined,
        isRead: false,
      },
    });
  }

  async findUserEmailAndName(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
  }
}

export const notificationRepository = new NotificationRepository();
