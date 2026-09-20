export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ConversationParticipantDto {
  id: string;
  name: string;
  role: string;
  image?: string | null;
}

export interface ConversationPropertyDto {
  id: string;
  titleEn: string;
  slug: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  areaName?: string | null;
}

export interface ConversationDto {
  id: string;
  propertyId: string;
  buyerId: string;
  agentId: string;
  property: ConversationPropertyDto;
  counterparty: ConversationParticipantDto;
  unreadCount: number;
  latestMessage?: MessageDto | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationInput {
  propertyId: string;
  initialMessage?: string;
}

export interface SendMessageInput {
  body: string;
}

export interface MessagesPageDto {
  items: MessageDto[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
  };
}
