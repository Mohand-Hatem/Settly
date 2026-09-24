import React, { Suspense } from "react";
import type { Metadata } from "next";
import { SearchWorkspace } from "@/components/search/SearchWorkspace";
import "@/styles/settly/search.css";

export const metadata: Metadata = {
  title: "Search Verified Residences — Settly Egypt",
  description:
    "Explore CAD-audited luxury standalone villas, sky villas, penthouses, and townhouses in New Cairo, Sheikh Zayed, and North Coast with synchronized GIS spatial mapping and transparent financial schedules.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F6F3]" />}>
      <SearchWorkspace />
    </Suspense>
  );
}
