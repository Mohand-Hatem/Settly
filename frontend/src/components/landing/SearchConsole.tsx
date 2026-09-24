"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export function SearchConsole() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"BUY" | "RENT">("BUY");
  const [location, setLocation] = useState("All regions — Egypt");
  const [propertyType, setPropertyType] = useState("Any type");
  const [priceRange, setPriceRange] = useState("Any price (EGP)");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (activeTab === "RENT") params.set("intent", "RENT");
    else params.set("intent", "SALE");

    if (location && location !== "All regions — Egypt") params.set("location", location);
    if (propertyType && propertyType !== "Any type") params.set("type", propertyType);
    if (priceRange && priceRange !== "Any price (EGP)") params.set("price", priceRange);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="console rise d3">
      <div className="tabs" role="tablist" aria-label="Listing type">
        <button
          className="tab"
          role="tab"
          aria-selected={activeTab === "BUY"}
          type="button"
          onClick={() => setActiveTab("BUY")}
        >
          Buy Resale
        </button>
        <button
          className="tab"
          role="tab"
          aria-selected={activeTab === "RENT"}
          type="button"
          onClick={() => setActiveTab("RENT")}
        >
          Rent
        </button>
      </div>
      <form className="console-body" onSubmit={handleSearch}>
        <div className="field">
          <label htmlFor="f-loc">Location</label>
          <select
            id="f-loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>All regions — Egypt</option>
            <option>New Cairo (Fifth Settlement)</option>
            <option>Sheikh Zayed &amp; 6th of October</option>
            <option>North Coast (Sahel)</option>
            <option>New Administrative Capital</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-type">Property type</label>
          <select
            id="f-type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option>Any type</option>
            <option>Standalone villa</option>
            <option>Twin house</option>
            <option>Duplex</option>
            <option>Penthouse</option>
            <option>Apartment</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-price">Price</label>
          <select
            id="f-price"
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
          >
            <option>Any price (EGP)</option>
            <option>Under 15,000,000</option>
            <option>15,000,000 – 35,000,000</option>
            <option>35,000,000 and above</option>
          </select>
        </div>
        <div className="console-go">
          <button
            type="submit"
            className="btn btn-accent"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "6px" }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
