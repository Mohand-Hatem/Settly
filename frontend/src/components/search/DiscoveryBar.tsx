"use client";

import React from "react";
import { X } from "lucide-react";

export type ViewMode = "split" | "grid" | "map";

interface DiscoveryBarProps {
  count: number;
  activeChips: { key: string; label: string }[];
  onRemoveChip: (key: string) => void;
  onClearAll: () => void;
  sortValue: string;
  onSortChange: (sort: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenFilters?: () => void;
  activeFilterCount?: number;
}

export function DiscoveryBar({
  count,
  activeChips,
  onRemoveChip,
  onClearAll,
  sortValue,
  onSortChange,
  viewMode,
  onViewModeChange,
  onOpenFilters,
  activeFilterCount = 0,
}: DiscoveryBarProps) {
  return (
    <div className="discovery-bar">
      <div className="wrap discovery-bar-row">
        <div className="discovery-meta">
          <span className="discovery-tally" id="resultsCount">
            {count} Verified Residences
          </span>
          <span className="discovery-sub">
            New Cairo & Sheikh Zayed · 100% Freehold & CAD Audited
          </span>
        </div>

        <div className="discovery-chips" id="activeChipsList">
          {activeChips.map((chip) => (
            <span key={chip.key} className="active-chip">
              <span>{chip.label}</span>
              <button
                type="button"
                aria-label={`Remove filter ${chip.label}`}
                onClick={() => onRemoveChip(chip.key)}
              >
                <X className="w-2.5 h-2.5" strokeWidth={3} />
              </button>
            </span>
          ))}
          {activeChips.length > 0 && (
            <button
              type="button"
              className="clear-all-btn"
              id="clearFiltersBtn"
              onClick={onClearAll}
            >
              Clear all
            </button>
          )}
        </div>

        <div className="discovery-actions">
          {onOpenFilters && (
            <button
              type="button"
              className="mobile-filter-btn"
              id="mobileFilterBtn"
              aria-label="Open filter criteria drawer"
              onClick={onOpenFilters}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="mobile-filter-badge">{activeFilterCount}</span>
              )}
            </button>
          )}

          <select
            className="sort-select"
            id="sortSelect"
            aria-label="Sort listings"
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="verified">Verified / Featured first</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="sqm">Price per m² (Lowest)</option>
            <option value="delivery">Handover: Earliest</option>
          </select>

          <div
            className="view-toggle-grp"
            role="group"
            aria-label="View layout switcher"
            data-mode={viewMode}
          >
            <button
              type="button"
              className={`view-btn ${viewMode === "split" ? "active" : ""}`}
              id="btnViewSplit"
              title="Split view (List + Map)"
              onClick={() => onViewModeChange("split")}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect width="8" height="18" x="3" y="3" rx="1" />
                <rect width="8" height="18" x="13" y="3" rx="1" />
              </svg>
              <span>Split</span>
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              id="btnViewGrid"
              title="List view"
              onClick={() => onViewModeChange("grid")}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span className="desktop-view-label">Grid</span>
              <span className="mobile-view-label">List</span>
            </button>
            <button
              type="button"
              className={`view-btn ${viewMode === "map" ? "active" : ""}`}
              id="btnViewMap"
              title="Map view only"
              onClick={() => onViewModeChange("map")}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" x2="9" y1="3" y2="18" />
                <line x1="15" x2="15" y1="6" y2="21" />
              </svg>
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
