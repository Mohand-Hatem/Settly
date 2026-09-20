"use client";

import { useEffect, useRef, useState } from "react";

export interface ChatMessageEvent {
  conversationId: string;
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    attachments?: Record<string, unknown> | null;
    isRead: boolean;
    readAt?: string | null;
    createdAt: string;
  };
}

export interface ChatReadEvent {
  conversationId: string;
  readerId: string;
}

interface UseChatWebSocketOptions {
  onMessageReceived?: (event: ChatMessageEvent) => void;
  onConversationRead?: (event: ChatReadEvent) => void;
}

export function useChatWebSocket(options?: UseChatWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;

      const httpBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const wsUrl = httpBase.replace(/^http/, "ws") + "/ws/chat";

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!unmounted) {
            setIsConnected(true);
          }
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message:new" && optionsRef.current?.onMessageReceived) {
              optionsRef.current.onMessageReceived(data);
            } else if (data.type === "conversation:read" && optionsRef.current?.onConversationRead) {
              optionsRef.current.onConversationRead(data);
            }
          } catch {
            // Ignore non-JSON or invalid packets
          }
        };

        ws.onclose = (e) => {
          if (!unmounted) {
            setIsConnected(false);
            socketRef.current = null;
            // Reconnect after 3s unless explicitly unauthorized
            if (e.code !== 4401) {
              reconnectTimeoutRef.current = setTimeout(connect, 3000);
            }
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        if (!unmounted) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  return { isConnected };
}
