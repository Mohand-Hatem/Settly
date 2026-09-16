import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SettlyAssistantWidget } from "@/components/layout/SettlyAssistantWidget";
import { MockupRibbon } from "@/components/layout/MockupRibbon";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink selection:bg-brass-200 selection:text-navy-950">
      <MockupRibbon />
      {/* 1. Master Global Sticky Navigation */}
      <Navbar />

      {/* 3. Main Page Surface */}
      <main className="flex-1 w-full">{children}</main>

      {/* 4. Unified 4-Column Luxury Broadsheet Footer */}
      <Footer />

      {/* 5. Universal Settly AI Assistant Floating FAB & Slide-over Drawer */}
      <SettlyAssistantWidget />
    </div>
  );
}
