"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import { MessagingTerminalSkeleton } from "@/components/ui/Skeleton";

function AgentMessagesContent() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("id");

  return <MessagingTerminal currentRole="AGENT" initialConversationId={initialConversationId} />;
}

export default function AgentMessagesPage() {
  return (
    <Suspense fallback={<MessagingTerminalSkeleton />}>
      <AgentMessagesContent />
    </Suspense>
  );
}
