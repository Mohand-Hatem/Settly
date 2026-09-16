import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { CapabilityStrip } from "@/components/landing/CapabilityStrip";
import { DiscoveryCockpit } from "@/components/landing/DiscoveryCockpit";
import { CuratedCollections } from "@/components/landing/CuratedCollections";
import { SpatialMapShowcase } from "@/components/landing/SpatialMapShowcase";
import { StepsSection, ViewingScheduler } from "@/components/landing/StepsAndViewing";
import { MetricsPillars } from "@/components/landing/MetricsPillars";
import { AssistantShowcase } from "@/components/landing/AssistantShowcase";
import { MobileShowcase } from "@/components/landing/MobileShowcase";
import { AgentShowcase } from "@/components/landing/AgentShowcase";
import { MarketInsightsDeck } from "@/components/landing/MarketInsightsDeck";
import { SearchAlertsSection } from "@/components/landing/SearchAlertsSection";

export default function LandingPage() {
  return (
    <main className="w-full flex flex-col">
      {/* 1. Broadsheet Hero with Search Console */}
      <HeroSection />

      {/* 2. Capability Strip */}
      <CapabilityStrip />

      {/* 3. Three Ways to Find It Discovery Cockpit (Spreadsheet, Map, Sentence, Infinite Marquee) */}
      <DiscoveryCockpit />

      {/* 4. Curated Featured Residences (4:4.65 portrait cards with EGP/m² chips) */}
      <CuratedCollections />

      {/* 5. Spatial Radar Map Showcase (SVG Basemap, Polygon boundary, interactive pins & popups) */}
      <SpatialMapShowcase />

      {/* 6. Purchase Workflow (4 steps from search to keys) */}
      <StepsSection />

      {/* 7. Interactive Viewing Scheduler (Calendar day & time slot selector) */}
      <ViewingScheduler />

      {/* 8. Metric Pricing vs Adjectives (Photo 10, EGP 60,185/m² badge & 4 checks) */}
      <MetricsPillars />

      {/* 9. AI Advisory Assistant (Conversational prompt demo with match scoring) */}
      <AssistantShowcase />

      {/* 10. Mobile Experience (Phone photo & responsive capability items) */}
      <MobileShowcase />

      {/* 11. Independent Agent Panoramic Section & Live Cockpit Simulator */}
      <AgentShowcase />

      {/* 12. Market Insights 3D Card Spread Deck (5 articles spreading on hover) */}
      <MarketInsightsDeck />

      {/* 13. Saved Search Match Alerts Form */}
      <SearchAlertsSection />
    </main>
  );
}

