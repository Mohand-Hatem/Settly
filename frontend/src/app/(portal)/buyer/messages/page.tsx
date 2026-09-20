"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessagingTerminal } from "@/components/messaging/MessagingTerminal";
import { MessagingTerminalSkeleton } from "@/components/ui/Skeleton";

function BuyerMessagesContent() {
  const searchParams = useSearchParams();
  const initialConversationId = searchParams.get("id");

  return <MessagingTerminal currentRole="BUYER" initialConversationId={initialConversationId} />;
}

export default function BuyerMessagesPage() {
  return (
    <Suspense fallback={<MessagingTerminalSkeleton />}>
      <BuyerMessagesContent />
    </Suspense>
  );
}
