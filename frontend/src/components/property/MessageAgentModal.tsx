"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/api/client";

export function MessageAgentModal({
  propertyId,
  propertyTitle,
  agentName,
  isOpen,
  onClose,
}: {
  propertyId: string;
  propertyTitle: string;
  agentName: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(
    `Hello ${agentName}, I am interested in ${propertyTitle} and would like to ask a few questions regarding the listing terms.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data, error, response } = await apiClient.POST("/api/v1/conversations", {
        body: {
          propertyId,
          initialMessage: message.trim(),
        },
      });

      if (response.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (error) {
        const detail = (error as { detail?: string }).detail || "Failed to start conversation. Please try again.";
        setErrorMessage(detail);
        return;
      }

      if (data) {
        onClose();
        router.push(`/buyer/messages?id=${data.id}`);
      }
    } catch {
      setErrorMessage("An unexpected network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Message Listing Agent">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Context Strip */}
        <div className="rounded-lg bg-[#F7F6F3] p-3 border border-[#E2DFD7] text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-[#131D36]">{agentName}</span>
            <span className="font-mono text-[10px] text-[#3D5A4C] bg-[#EBF2EE] px-2 py-0.5 rounded font-medium">
              Verified Advisor
            </span>
          </div>
          <p className="text-[#717680] truncate">{propertyTitle}</p>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-lg bg-[#FBF8F3] p-3 border border-[#E6D2B5] text-xs text-[#AE8033] flex items-start gap-2">
          <span className="text-sm">🛡️</span>
          <p className="leading-relaxed">
            Your personal contact number is kept completely confidential. Messaging takes place through your secure Settly portal desk.
          </p>
        </div>

        {/* Text Input */}
        <div>
          <label className="block text-xs font-mono font-semibold uppercase text-[#131D36] mb-1.5">
            Initial Inquiry Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={2000}
            required
            className="w-full p-3 text-sm rounded-lg border border-[#E2DFD7] bg-white focus:outline-none focus:border-[#C69749] text-[#181D27] placeholder-[#717680] resize-none"
            placeholder="Type your questions or inquiry here..."
          />
          <div className="flex justify-between items-center mt-1 text-[10px] font-mono text-[#717680]">
            <span>Minimum 5 characters</span>
            <span>{message.length} / 2000</span>
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2DFD7]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className="bg-[#131D36] hover:bg-[#1E2A4A] text-white"
          >
            {isSubmitting ? "Starting Conversation..." : "Send Message & Open Chat"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
