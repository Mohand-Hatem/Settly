import { messagingRepository } from "../repository/index.js";
import { broadcastToUser } from "../events/index.js";
import { notificationService } from "../../notifications/service/index.js";
import { notFoundError, conflictError, validationError } from "../../../shared/errors/problem-details.js";
import type {
  ConversationDto,
  MessageDto,
  MessagesPageDto,
  CreateConversationInput,
  SendMessageInput,
} from "../types/index.js";
import { z } from "zod";

export const CreateConversationSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  initialMessage: z.string().max(2000, "Message cannot exceed 2000 characters").optional(),
});

export const SendMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(2000, "Message cannot exceed 2000 characters"),
});

export class MessagingService {
  async listUserConversations(userId: string): Promise<{ items: ConversationDto[] }> {
    const rawConversations = await messagingRepository.findConversationsByUser(userId);

    const items: ConversationDto[] = rawConversations.map((conv) => {
      const isBuyer = conv.buyerId === userId;
      const counterpartyUser = isBuyer ? conv.agent : conv.buyer;
      const latest = conv.messages[0];

      return {
        id: conv.id,
        propertyId: conv.propertyId,
        buyerId: conv.buyerId,
        agentId: conv.agentId,
        property: {
          id: conv.property.id,
          titleEn: conv.property.titleEn || "Property Listing",
          slug: conv.property.slug,
          price: Number(conv.property.price),
          currency: "EGP",
          imageUrl: conv.property.images?.[0]?.url ?? null,
          areaName: conv.property.area?.nameEn ?? null,
        },
        counterparty: {
          id: counterpartyUser.id,
          name: counterpartyUser.name,
          role: counterpartyUser.role,
          image: counterpartyUser.image,
        },
        unreadCount: conv._count.messages,
        latestMessage: latest
          ? {
              id: latest.id,
              conversationId: latest.conversationId,
              senderId: latest.senderId,
              body: latest.body,
              attachments: latest.attachments as Record<string, unknown> | null,
              isRead: latest.isRead,
              readAt: latest.readAt ? latest.readAt.toISOString() : null,
              createdAt: latest.createdAt.toISOString(),
            }
          : null,
        lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
      };
    });

    return { items };
  }

  async getConversationById(conversationId: string, userId: string): Promise<ConversationDto> {
    const conv = await messagingRepository.findConversationById(conversationId);
    if (!conv || (conv.buyerId !== userId && conv.agentId !== userId)) {
      throw notFoundError("Conversation", conversationId);
    }

    const isBuyer = conv.buyerId === userId;
    const counterpartyUser = isBuyer ? conv.agent : conv.buyer;

    return {
      id: conv.id,
      propertyId: conv.propertyId,
      buyerId: conv.buyerId,
      agentId: conv.agentId,
      property: {
        id: conv.property.id,
        titleEn: conv.property.titleEn || "Property Listing",
        slug: conv.property.slug,
        price: Number(conv.property.price),
        currency: "EGP",
        imageUrl: conv.property.images?.[0]?.url ?? null,
        areaName: conv.property.area?.nameEn ?? null,
      },
      counterparty: {
        id: counterpartyUser.id,
        name: counterpartyUser.name,
        role: counterpartyUser.role,
        image: counterpartyUser.image,
      },
      unreadCount: 0,
      lastMessageAt: conv.lastMessageAt ? conv.lastMessageAt.toISOString() : null,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
    };
  }

  async startConversation(buyerId: string, input: CreateConversationInput): Promise<ConversationDto> {
    const parseResult = CreateConversationSchema.safeParse(input);
    if (!parseResult.success) {
      throw validationError(parseResult.error);
    }

    const { propertyId, initialMessage } = parseResult.data;

    const property = await messagingRepository.findPropertyById(propertyId);
    if (!property) {
      throw notFoundError("Property", propertyId);
    }

    // Invariant #59: Agent cannot message their own listing
    if (property.agentId === buyerId) {
      throw conflictError(
        "/errors/conflict",
        "Own Listing Invariant",
        "You cannot start a conversation on your own property listing."
      );
    }

    // Status check: Only published or reserved properties can be messaged
    if (property.status !== "PUBLISHED" && property.status !== "RESERVED") {
      throw conflictError(
        "/errors/conflict",
        "Invalid Property Status",
        `Cannot message agent for a property with status ${property.status}.`
      );
    }

    // 1. Create or retrieve conversation
    const conversation = await messagingRepository.findOrCreateConversation(buyerId, property.agentId, propertyId);

    // 2. Auto-lead generation (Decision #75)
    await messagingRepository.upsertLead(buyerId, property.agentId, propertyId);

    // 3. If initial message provided, persist and broadcast
    let firstMessage: MessageDto | null = null;
    if (initialMessage && initialMessage.trim().length > 0) {
      const created = await messagingRepository.createMessage(conversation.id, buyerId, initialMessage.trim());
      firstMessage = {
        id: created.id,
        conversationId: created.conversationId,
        senderId: created.senderId,
        body: created.body,
        attachments: null,
        isRead: created.isRead,
        readAt: null,
        createdAt: created.createdAt.toISOString(),
      };

      // Notify agent via WebSocket
      broadcastToUser(property.agentId, {
        type: "message:new",
        conversationId: conversation.id,
        message: firstMessage,
      });

      void notificationService
        .notifyUser({
          userId: property.agentId,
          type: "NEW_MESSAGE",
          params: {
            conversationId: conversation.id,
            propertyTitle: property.titleEn,
            senderName: "Prospective Buyer",
            snippet: initialMessage.trim().slice(0, 100),
            recipientRole: "agent",
          },
          sendEmail: true,
        })
        .catch(() => {});
    }

    return this.getConversationById(conversation.id, buyerId);
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<MessagesPageDto> {
    const conv = await messagingRepository.findConversationById(conversationId);
    if (!conv || (conv.buyerId !== userId && conv.agentId !== userId)) {
      throw notFoundError("Conversation", conversationId);
    }

    const rawMessages = await messagingRepository.findMessages(conversationId, cursor, limit);
    const hasMore = rawMessages.length > (limit ?? 50);
    const items = (hasMore ? rawMessages.slice(0, limit ?? 50) : rawMessages).map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      body: m.body,
      attachments: m.attachments as Record<string, unknown> | null,
      isRead: m.isRead,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
    }));

    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.id : null;

    return {
      items,
      pageInfo: {
        nextCursor,
        hasNextPage: hasMore,
      },
    };
  }

  async sendMessage(conversationId: string, senderId: string, input: SendMessageInput): Promise<MessageDto> {
    const parseResult = SendMessageSchema.safeParse(input);
    if (!parseResult.success) {
      throw validationError(parseResult.error);
    }

    const conv = await messagingRepository.findConversationById(conversationId);
    if (!conv || (conv.buyerId !== senderId && conv.agentId !== senderId)) {
      throw notFoundError("Conversation", conversationId);
    }

    const created = await messagingRepository.createMessage(conversationId, senderId, parseResult.data.body);

    const messageDto: MessageDto = {
      id: created.id,
      conversationId: created.conversationId,
      senderId: created.senderId,
      body: created.body,
      attachments: null,
      isRead: created.isRead,
      readAt: null,
      createdAt: created.createdAt.toISOString(),
    };

    const recipientId = conv.buyerId === senderId ? conv.agentId : conv.buyerId;

    // Real-time broadcast to recipient
    broadcastToUser(recipientId, {
      type: "message:new",
      conversationId,
      message: messageDto,
    });

    void notificationService
      .notifyUser({
        userId: recipientId,
        type: "NEW_MESSAGE",
        params: {
          conversationId,
          propertyTitle: conv.property.titleEn,
          senderName: conv.buyerId === senderId ? conv.buyer.name : conv.agent.name,
          snippet: created.body.slice(0, 100),
          recipientRole: conv.buyerId === senderId ? "agent" : "buyer",
        },
        sendEmail: true,
      })
      .catch(() => {});

    return messageDto;
  }

  async markAsRead(conversationId: string, readerId: string): Promise<{ success: boolean }> {
    const conv = await messagingRepository.findConversationById(conversationId);
    if (!conv || (conv.buyerId !== readerId && conv.agentId !== readerId)) {
      throw notFoundError("Conversation", conversationId);
    }

    await messagingRepository.markMessagesRead(conversationId, readerId);

    const counterpartyId = conv.buyerId === readerId ? conv.agentId : conv.buyerId;
    broadcastToUser(counterpartyId, {
      type: "conversation:read",
      conversationId,
      readerId,
    });

    return { success: true };
  }
}

export const messagingService = new MessagingService();
