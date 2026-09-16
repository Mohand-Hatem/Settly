"use client";

import React from "react";

interface FacetRailProps {
  locations: { name: string; count: number }[];
  selectedLocations: string[];
  onToggleLocation: (loc: string) => void;

  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  activePriceChip: string | null;
  onSelectPriceChip: (chip: string) => void;

  types: { id: string; name: string; count: number }[];
  selectedTypes: string[];
  onToggleType: (type: string) => void;

  handovers: { id: string; name: string; count: number }[];
  selectedHandovers: string[];
  onToggleHandover: (handover: string) => void;

  developers: { name: string; count: number }[];
  selectedDevelopers: string[];
  onToggleDeveloper: (dev: string) => void;
}

export function FacetRail({
  locations,
  selectedLocations,
  onToggleLocation,
  maxPrice,
  onMaxPriceChange,
  activePriceChip,
  onSelectPriceChip,
  types,
  selectedTypes,
  onToggleType,
  handovers,
  selectedHandovers,
  onToggleHandover,
  developers,
  selectedDevelopers,
  onToggleDeveloper,
}: FacetRailProps) {
  return (
    <aside className="facet-rail">
      {/* Section: Micro-Markets */}
      <div className="facet-sec">
        <div className="facet-title">
          <span>Location & District</span>
          <span className="facet-count">{locations.length} areas</span>
        </div>
        <div className="facet-list">
          {locations.map((loc) => (
            <label key={loc.name} className="facet-item">
              <span className="facet-chk">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(loc.name)}
                  onChange={() => onToggleLocation(loc.name)}
                />
                <span>{loc.name}</span>
              </span>
              <span className="facet-count">{loc.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section: Price Range */}
      <div className="facet-sec">
        <div className="facet-title">
          <span>Price Range (EGP)</span>
        </div>
        <div className="rail-slider-readout">
          <span>15.0M EGP</span>
          <span>{maxPrice}.0M EGP</span>
        </div>
        <input
          type="range"
          className="rail-range-track"
          min="15"
          max="60"
          value={maxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          id="priceRangeSlider"
        />
        <div className="quick-price-chips">
          <button
            type="button"
            className={`quick-chip ${activePriceChip === "under20" ? "active" : ""}`}
            onClick={() => onSelectPriceChip("under20")}
          >
            &lt; 20M
          </button>
          <button
            type="button"
            className={`quick-chip ${activePriceChip === "20to35" ? "active" : ""}`}
            onClick={() => onSelectPriceChip("20to35")}
          >
            20M – 35M
          </button>
          <button
            type="button"
            className={`quick-chip ${activePriceChip === "35to50" ? "active" : ""}`}
            onClick={() => onSelectPriceChip("35to50")}
          >
            35M – 50M
          </button>
          <button
            type="button"
            className={`quick-chip ${activePriceChip === "over50" ? "active" : ""}`}
            onClick={() => onSelectPriceChip("over50")}
          >
            50M+
          </button>
        </div>
      </div>

      {/* Section: Property Type */}
      <div className="facet-sec">
        <div className="facet-title">
          <span>Property Type</span>
        </div>
        <div className="facet-list">
          {types.map((t) => (
            <label key={t.id} className="facet-item">
              <span className="facet-chk">
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(t.id)}
                  onChange={() => onToggleType(t.id)}
                />
                <span>{t.name}</span>
              </span>
              <span className="facet-count">{t.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section: Handover Timing */}
      <div className="facet-sec">
        <div className="facet-title">
          <span>Handover Timing</span>
        </div>
        <div className="facet-list">
          {handovers.map((h) => (
            <label key={h.id} className="facet-item">
              <span className="facet-chk">
                <input
                  type="checkbox"
                  checked={selectedHandovers.includes(h.id)}
                  onChange={() => onToggleHandover(h.id)}
                />
                <span>{h.name}</span>
              </span>
              <span className="facet-count">{h.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Section: Master Developers */}
      <div className="facet-sec">
        <div className="facet-title">
          <span>Developers</span>
        </div>
        <div className="facet-list">
          {developers.map((dev) => (
            <label key={dev.name} className="facet-item">
              <span className="facet-chk">
                <input
                  type="checkbox"
                  checked={selectedDevelopers.includes(dev.name)}
                  onChange={() => onToggleDeveloper(dev.name)}
                />
                <span>{dev.name}</span>
              </span>
              <span className="facet-count">{dev.count}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
