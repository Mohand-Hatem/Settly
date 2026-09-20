"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiClient } from "@/api/client";
import { useChatWebSocket, type ChatMessageEvent, type ChatReadEvent } from "./useChatWebSocket";
import { MessagingSidebarSkeleton, Skeleton } from "@/components/ui/Skeleton";

interface ConversationProperty {
  id: string;
  titleEn: string;
  slug: string;
  price: number;
  currency: string;
  imageUrl?: string | null;
  areaName?: string | null;
}

interface ConversationParticipant {
  id: string;
  name: string;
  role: string;
  image?: string | null;
}

interface MessageItem {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  attachments?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

interface ConversationItem {
  id: string;
  propertyId: string;
  buyerId: string;
  agentId: string;
  property: ConversationProperty;
  counterparty: ConversationParticipant;
  unreadCount: number;
  latestMessage?: MessageItem | null;
  lastMessageAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MessagingTerminalProps {
  currentRole: "BUYER" | "AGENT";
  initialConversationId?: string | null;
}

function formatEGP(amount: number): string {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function MessagingTerminal({ currentRole, initialConversationId }: MessagingTerminalProps) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(Boolean(initialConversationId));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load current user profile for message alignment
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await apiClient.GET("/api/v1/me");
        if (data) {
          setCurrentUserId(data.id);
        }
      } catch {
        // Fallback handled by role matching
      }
    }
    loadUser();
  }, []);

  // Fetch all user conversations
  const fetchConversations = useCallback(async () => {
    try {
      setIsLoadingConversations(true);
      const { data, error } = await apiClient.GET("/api/v1/me/conversations");
      if (data && !error) {
        const items = (data.items || []) as unknown as ConversationItem[];
        setConversations(items);

        // If no conversation is selected yet, pick initial or first
        if (!selectedConversationId && items.length > 0) {
          const defaultId = initialConversationId && items.some((c) => c.id === initialConversationId)
            ? initialConversationId
            : items[0].id;
          setSelectedConversationId(defaultId);
        }
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoadingConversations(false);
    }
  }, [initialConversationId, selectedConversationId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when selectedConversationId changes
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    let unmounted = false;

    async function loadMessages() {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await apiClient.GET("/api/v1/conversations/{id}/messages", {
          params: { path: { id: selectedConversationId! } },
        });

        if (!unmounted && data && !error) {
          setMessages(data.items as unknown as MessageItem[]);

          // Mark conversation as read
          apiClient.POST("/api/v1/conversations/{id}/read", {
            params: { path: { id: selectedConversationId! } },
          });

          // Update local unread counter
          setConversations((prev) =>
            prev.map((c) => (c.id === selectedConversationId ? { ...c, unreadCount: 0 } : c))
          );
        }
      } catch {
        // Handled
      } finally {
        if (!unmounted) {
          setIsLoadingMessages(false);
        }
      }
    }

    loadMessages();

    return () => {
      unmounted = true;
    };
  }, [selectedConversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoadingMessages]);

  // Handle incoming real-time WebSocket events
  const handleMessageReceived = useCallback(
    (event: ChatMessageEvent) => {
      const { conversationId, message } = event;

      // Update conversations list (move to top, set latestMessage)
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversationId);
        if (!exists) {
          fetchConversations();
          return prev;
        }

        return prev.map((c) => {
          if (c.id === conversationId) {
            const isCurrentlySelected = c.id === selectedConversationId;
            return {
              ...c,
              latestMessage: message as unknown as MessageItem,
              lastMessageAt: message.createdAt,
              unreadCount: isCurrentlySelected ? 0 : c.unreadCount + 1,
            };
          }
          return c;
        });
      });

      // If this is the active conversation, append message and mark read
      if (conversationId === selectedConversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message as unknown as MessageItem];
        });

        apiClient.POST("/api/v1/conversations/{id}/read", {
          params: { path: { id: conversationId } },
        });
      }
    },
    [selectedConversationId, fetchConversations]
  );

  const handleConversationRead = useCallback(
    (event: ChatReadEvent) => {
      if (event.conversationId === selectedConversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.senderId === currentUserId ? { ...m, isRead: true, readAt: new Date().toISOString() } : m
          )
        );
      }
    },
    [selectedConversationId, currentUserId]
  );

  const { isConnected } = useChatWebSocket({
    onMessageReceived: handleMessageReceived,
    onConversationRead: handleConversationRead,
  });

  // Send message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!text || !selectedConversationId || isSending) return;

    setIsSending(true);
    setInputText("");

    try {
      const { data, error } = await apiClient.POST("/api/v1/conversations/{id}/messages", {
        params: { path: { id: selectedConversationId } },
        body: { body: text },
      });

      if (data && !error) {
        const newMsg = data as unknown as MessageItem;
        setMessages((prev) => [...prev, newMsg]);

        // Update conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId
              ? {
                  ...c,
                  latestMessage: newMsg,
                  lastMessageAt: newMsg.createdAt,
                }
              : c
          )
        );
      }
    } catch {
      // Error handled
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedConversationId);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.counterparty.name.toLowerCase().includes(q) ||
      c.property.titleEn.toLowerCase().includes(q) ||
      (c.property.areaName && c.property.areaName.toLowerCase().includes(q))
    );
  });

  const quickReplies =
    currentRole === "BUYER"
      ? [
          "Is this property still available?",
          "Can we schedule a viewing this week?",
          "What are the payment terms?",
          "Are there remaining instalments?",
        ]
      : [
          "Yes, this property is available.",
          "Let's schedule a viewing for you.",
          "I have received your inquiry and will follow up.",
        ];

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-80px)] min-h-[640px] max-w-7xl mx-auto w-full p-2 sm:p-4 lg:p-6">
      {/* Top Advisory Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#717680]">
          <span className="uppercase tracking-wider font-semibold text-[#131D36]">Portal</span>
          <span>/</span>
          <span className="text-[#C69749] font-medium">Messages &amp; Advisory</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Trust Chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2EE] border border-[#3D5A4C]/20 text-[#3D5A4C] text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-[#3D5A4C] animate-pulse" />
            <span>Encrypted Deal Desk</span>
          </div>

          {/* Connection Status Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
              isConnected
                ? "bg-[#EBF2EE] text-[#3D5A4C] border-[#3D5A4C]/30"
                : "bg-[#FBF8F3] text-[#AE8033] border-[#C69749]/30"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[#3D5A4C]" : "bg-[#AE8033]"}`} />
            <span>{isConnected ? "Live Socket" : "Polling Mode"}</span>
          </div>
        </div>
      </div>

      {/* Main Terminal Frame */}
      <div className="flex flex-1 overflow-hidden bg-white border border-[#E2DFD7] rounded-xl shadow-sm">
        {/* Left Pane: Channels Directory */}
        <section
          className={`w-full lg:w-96 flex-shrink-0 flex flex-col border-r border-[#E2DFD7] bg-[#F7F6F3]/50 ${
            showChatMobile ? "hidden lg:flex" : "flex"
          }`}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-[#E2DFD7] bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-bold text-[#131D36]">Conversations</h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-[#F7F6F3] text-[#717680] border border-[#E2DFD7]">
                {conversations.length} Active
              </span>
            </div>

            <div className="relative">
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-[#717680]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by advisor or property..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E2DFD7] bg-[#F7F6F3] focus:bg-white focus:outline-none focus:border-[#C69749] text-[#181D27] placeholder-[#717680]"
              />
            </div>
          </div>

          {/* Conversation List Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#E2DFD7]">
            {isLoadingConversations ? (
              <MessagingSidebarSkeleton />
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-[#F7F6F3] border border-[#E2DFD7] flex items-center justify-center mx-auto mb-3 text-[#717680]">
                  💬
                </div>
                <p className="text-sm font-semibold text-[#131D36] mb-1">No conversations found</p>
                <p className="text-xs text-[#717680]">
                  {searchQuery ? "No results match your search." : "Inquire about listings to start messaging."}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversationId(conv.id);
                      setShowChatMobile(true);
                    }}
                    className={`w-full text-left p-4 transition-colors flex items-start gap-3 relative ${
                      isSelected
                        ? "bg-[#FBF8F3] border-l-4 border-l-[#C69749]"
                        : "hover:bg-white/80 border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conv.counterparty.image ? (
                        <Image
                          src={conv.counterparty.image}
                          alt={conv.counterparty.name}
                          width={42}
                          height={42}
                          className="w-10 h-10 rounded-full object-cover border border-[#C69749]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#131D36] text-[#C69749] font-mono font-bold text-xs flex items-center justify-center border border-[#C69749]">
                          {conv.counterparty.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#3D5A4C] border-2 border-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-semibold text-sm text-[#131D36] truncate">
                          {conv.counterparty.name}
                        </span>
                        {conv.latestMessage && (
                          <span className="text-[10px] font-mono text-[#717680] flex-shrink-0">
                            {formatTimestamp(conv.latestMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      {/* Property badge chip */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-[#E2DFD7] text-[#131D36] truncate">
                          {conv.property.titleEn}
                        </span>
                      </div>

                      {/* Snippet + unread pill */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-[#717680] truncate">
                          {conv.latestMessage ? conv.latestMessage.body : "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#C69749] text-white text-[10px] font-mono font-bold flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Right Pane: Active Discussion Desk */}
        <section
          className={`flex-1 flex flex-col bg-white overflow-hidden ${
            showChatMobile ? "flex" : "hidden lg:flex"
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Active Chat Top Header */}
              <div className="p-3 sm:p-4 border-b border-[#E2DFD7] bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setShowChatMobile(false)}
                    className="lg:hidden p-1.5 rounded-lg border border-[#E2DFD7] text-[#131D36] hover:bg-[#F7F6F3]"
                    aria-label="Back to conversations"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>

                  <div className="relative flex-shrink-0">
                    {selectedConversation.counterparty.image ? (
                      <Image
                        src={selectedConversation.counterparty.image}
                        alt={selectedConversation.counterparty.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-[#C69749]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#131D36] text-[#C69749] font-mono font-bold text-xs flex items-center justify-center border border-[#C69749]">
                        {selectedConversation.counterparty.name
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-[#131D36] truncate">
                        {selectedConversation.counterparty.name}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF2EE] text-[#3D5A4C] border border-[#3D5A4C]/20 font-medium">
                        {selectedConversation.counterparty.role === "AGENT" ? "Verified Advisor" : "Verified Buyer"}
                      </span>
                    </div>
                    <p className="text-xs text-[#717680] truncate font-mono">
                      Active Desk · Cairo Real Estate Exchange
                    </p>
                  </div>
                </div>

                <Link
                  href={`/properties/${selectedConversation.property.slug}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DFD7] text-xs font-semibold text-[#131D36] hover:border-[#C69749] transition-colors"
                >
                  <span>View Property</span>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
              </div>

              {/* Property Context Strip */}
              <div className="px-4 py-2.5 bg-[#F7F6F3] border-b border-[#E2DFD7] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {selectedConversation.property.imageUrl ? (
                    <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-[#E2DFD7]">
                      <Image
                        src={selectedConversation.property.imageUrl}
                        alt={selectedConversation.property.titleEn}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-white border border-[#E2DFD7] flex items-center justify-center flex-shrink-0 text-base">
                      🏛️
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="font-semibold text-[#131D36] truncate block">
                      {selectedConversation.property.titleEn}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-[#AE8033]">
                      {formatEGP(selectedConversation.property.price)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-[#717680] hidden sm:block">
                  {selectedConversation.property.areaName || "Cairo Region"}
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-white">
                {isLoadingMessages ? (
                  <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading message thread">
                    <div className="flex items-end gap-2.5 max-w-[75%]">
                      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                      <div className="rounded-2xl rounded-bl-sm border border-[#E2DFD7] bg-[#F7F6F3] p-3.5 space-y-1.5 w-60">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                      </div>
                    </div>
                    <div className="flex items-end justify-end gap-2.5 ml-auto max-w-[75%]">
                      <div className="rounded-2xl rounded-br-sm border border-[#C69749]/20 bg-[#C69749]/5 p-3.5 space-y-1.5 w-64">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                    <div className="flex items-end gap-2.5 max-w-[75%]">
                      <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                      <div className="rounded-2xl rounded-bl-sm border border-[#E2DFD7] bg-[#F7F6F3] p-3.5 space-y-1.5 w-48">
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm font-semibold text-[#131D36] mb-1">No messages exchanged yet</p>
                    <p className="text-xs text-[#717680]">
                      Send an initial message or select a prompt below to connect.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOutbound =
                      currentUserId !== null
                        ? msg.senderId === currentUserId
                        : currentRole === "BUYER"
                        ? msg.senderId === selectedConversation.buyerId
                        : msg.senderId === selectedConversation.agentId;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 sm:p-4 text-sm leading-relaxed shadow-sm ${
                            isOutbound
                              ? "bg-[#131D36] text-white rounded-br-none"
                              : "bg-[#F7F6F3] text-[#181D27] border border-[#E2DFD7] rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                        </div>

                        {/* Timestamp & Read state */}
                        <div
                          className={`flex items-center gap-1.5 mt-1 px-1 text-[10px] font-mono text-[#717680]`}
                        >
                          <span>{formatTimestamp(msg.createdAt)}</span>
                          {isOutbound && (
                            <span className={msg.isRead ? "text-[#C69749] font-bold" : "text-[#717680]"}>
                              {msg.isRead ? "✓✓ Read" : "✓ Sent"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Pills */}
              <div className="px-4 py-2 bg-[#F7F6F3] border-t border-[#E2DFD7] flex items-center gap-2 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-mono uppercase text-[#717680] flex-shrink-0 font-semibold">
                  Prompts:
                </span>
                {quickReplies.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isSending}
                    className="px-3 py-1 rounded-full bg-white border border-[#E2DFD7] text-xs text-[#131D36] whitespace-nowrap hover:border-[#C69749] hover:bg-[#FBF8F3] transition-colors disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Message Composer Area */}
              <div className="p-3 sm:p-4 border-t border-[#E2DFD7] bg-white">
                <div className="flex items-end gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      maxLength={2000}
                      rows={2}
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for newline)"
                      className="w-full resize-none p-3 text-sm rounded-xl border border-[#E2DFD7] bg-[#F7F6F3] focus:bg-white focus:outline-none focus:border-[#C69749] text-[#181D27] placeholder-[#717680]"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] font-mono text-[#717680]">
                      {inputText.length} / 2000
                    </span>
                  </div>

                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isSending}
                    className="px-5 py-3 rounded-xl bg-[#131D36] text-white hover:bg-[#1E2A4A] disabled:opacity-40 font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm flex-shrink-0"
                  >
                    <span>Send</span>
                    <svg className="w-4 h-4 text-[#C69749]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F7F6F3]/30">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2DFD7] flex items-center justify-center text-2xl shadow-sm mb-4">
                💬
              </div>
              <h3 className="font-serif text-xl font-bold text-[#131D36] mb-2">
                Settly Private Client Desk
              </h3>
              <p className="text-sm text-[#717680] max-w-md mb-6 leading-relaxed">
                Select a conversation from the sidebar to review property discussions, schedule viewings, or finalize offer details in private.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
