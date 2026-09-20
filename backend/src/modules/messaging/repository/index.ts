import { prisma } from "../../../shared/database/prisma.js";
import { uuidv7 } from "uuidv7";

export class MessagingRepository {
  async findConversationsByUser(userId: string) {
    return prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { agentId: userId }],
      },
      include: {
        property: {
          select: {
            id: true,
            titleEn: true,
            slug: true,
            price: true,
            images: {
              select: { url: true },
              take: 1,
              orderBy: { order: "asc" },
            },
            area: {
              select: {
                nameEn: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            messages: {
              where: {
                isRead: false,
                senderId: { not: userId },
              },
            },
          },
        },
      },
      orderBy: {
        lastMessageAt: { sort: "desc", nulls: "last" },
      },
    });
  }

  async findConversationById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            titleEn: true,
            slug: true,
            price: true,
            status: true,
            agentId: true,
            images: {
              select: { url: true },
              take: 1,
              orderBy: { order: "asc" },
            },
            area: {
              select: {
                nameEn: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            role: true,
            image: true,
          },
        },
      },
    });
  }

  async findPropertyById(propertyId: string) {
    return prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        titleEn: true,
        slug: true,
        status: true,
        agentId: true,
      },
    });
  }

  async findOrCreateConversation(buyerId: string, agentId: string, propertyId: string) {
    const existing = await prisma.conversation.findUnique({
      where: {
        buyerId_agentId_propertyId: {
          buyerId,
          agentId,
          propertyId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return prisma.conversation.create({
      data: {
        id: uuidv7(),
        buyerId,
        agentId,
        propertyId,
      },
    });
  }

  async upsertLead(buyerId: string, agentId: string, propertyId: string) {
    return prisma.lead.upsert({
      where: {
        buyerId_propertyId: {
          buyerId,
          propertyId,
        },
      },
      create: {
        id: uuidv7(),
        buyerId,
        agentId,
        propertyId,
        status: "NEW",
      },
      update: {
        updatedAt: new Date(),
      },
    });
  }

  async findMessages(conversationId: string, cursor?: string, limit: number = 50) {
    return prisma.message.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
  }

  async createMessage(conversationId: string, senderId: string, body: string) {
    const now = new Date();
    const id = uuidv7();

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          id,
          conversationId,
          senderId,
          body,
          createdAt: now,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: now },
      }),
    ]);

    return message;
  }

  async markMessagesRead(conversationId: string, readerId: string) {
    return prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: readerId },
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

export const messagingRepository = new MessagingRepository();
