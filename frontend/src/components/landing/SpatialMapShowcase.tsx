"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface MapHit {
  id: number;
  title: string;
  specs: string;
  developer: string;
  price: string;
  sqmPrice: string;
  image: string;
  tags: string[];
  pinX: string;
  pinY: string;
  pinLabel: string;
  flip: boolean;
}

export function SpatialMapShowcase() {
  const hits: MapHit[] = [
    {
      id: 0,
      title: "Lake View Signature Villa",
      specs: "Golden Square · 540 m² · 5 beds",
      developer: "Palm Hills",
      price: "EGP 32,500,000",
      sqmPrice: "EGP 60,185/m²",
      image: "/images/11.jpg",
      tags: ["villa", "ready"],
      pinX: "44%",
      pinY: "47%",
      pinLabel: "32.5M",
      flip: false,
    },
    {
      id: 1,
      title: "Katameya Dunes Twin House",
      specs: "Fifth Settlement · 310 m² · 4 beds",
      developer: "Katameya",
      price: "EGP 18,900,000",
      sqmPrice: "EGP 60,960/m²",
      image: "/images/2.jpg",
      tags: ["town"],
      pinX: "27%",
      pinY: "33%",
      pinLabel: "18.9M",
      flip: true,
    },
    {
      id: 2,
      title: "Mivida Crescent Standalone",
      specs: "Golden Square · 680 m² · 6 beds",
      developer: "Emaar Misr",
      price: "EGP 44,000,000",
      sqmPrice: "EGP 64,700/m²",
      image: "/images/7.jpg",
      tags: ["villa", "ready"],
      pinX: "62%",
      pinY: "29%",
      pinLabel: "44.0M",
      flip: true,
    },
    {
      id: 3,
      title: "Courtyard Townhouse",
      specs: "South 90th · 285 m² · 3 beds",
      developer: "SODIC",
      price: "EGP 21,400,000",
      sqmPrice: "EGP 75,080/m²",
      image: "/images/9.jpg",
      tags: ["town", "ready"],
      pinX: "35%",
      pinY: "69%",
      pinLabel: "21.4M",
      flip: false,
    },
    {
      id: 4,
      title: "Palm Court Residence",
      specs: "Mivida · 470 m² · 4 beds",
      developer: "Palm Hills",
      price: "EGP 29,800,000",
      sqmPrice: "EGP 63,400/m²",
      image: "/images/4.jpg",
      tags: ["villa"],
      pinX: "58%",
      pinY: "63%",
      pinLabel: "29.8M",
      flip: false,
    },
    {
      id: 5,
      title: "Villette Sky Villa",
      specs: "New Cairo · 390 m² · 4 beds",
      developer: "SODIC",
      price: "EGP 26,200,000",
      sqmPrice: "EGP 67,170/m²",
      image: "/images/5.jpg",
      tags: ["town", "ready"],
      pinX: "71%",
      pinY: "48%",
      pinLabel: "26.2M",
      flip: false,
    },
  ];

  const [activeTag, setActiveTag] = useState<string>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [inspectOpen, setInspectOpen] = useState<boolean>(true);

  const filteredHits = hits.filter((h) => {
    if (activeTag === "all") return true;
    return h.tags.includes(activeTag);
  });

  const selectedHit = hits[selectedIndex] || hits[0];

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    setInspectOpen(true);
  };

  const handleFilter = (tag: string) => {
    setActiveTag(tag);
    const firstMatching = hits.find((h) => tag === "all" || h.tags.includes(tag));
    if (firstMatching) {
      setSelectedIndex(firstMatching.id);
    }
  };

  return (
    <section className="sect mapsec" id="map">
      <div className="wrap">
        <div className="shead shead-row" style={{ maxWidth: "none" }}>
          <div style={{ maxWidth: "52ch" }}>
            <h2>Draw the area. See what&apos;s inside it.</h2>
            <p>
              Compound boundaries rarely match how people actually search. Draw
              your own shape on the map and every verified unit inside it comes
              back with its metrics attached.
            </p>
          </div>
          <Link className="slink" href="/search">
            Open the map
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div className="map-shell">
          <aside className="map-rail">
            <p className="map-count">
              <b>{filteredHits.length === 6 ? "142 units" : `${filteredHits.length} units`}</b> in this area
            </p>
            <div className="map-filters" id="mapRailFilters">
              <button
                type="button"
                className={activeTag === "all" ? "on" : ""}
                onClick={() => handleFilter("all")}
              >
                All (6)
              </button>
              <button
                type="button"
                className={activeTag === "villa" ? "on" : ""}
                onClick={() => handleFilter("villa")}
              >
                Villas (3)
              </button>
              <button
                type="button"
                className={activeTag === "town" ? "on" : ""}
                onClick={() => handleFilter("town")}
              >
                Twin &amp; Town (3)
              </button>
              <button
                type="button"
                className={activeTag === "ready" ? "on" : ""}
                onClick={() => handleFilter("ready")}
              >
                Ready 2026
              </button>
            </div>
            <div className="map-hits" id="mapHitsList">
              {filteredHits.map((hit) => {
                const isSelected = selectedIndex === hit.id;
                return (
                  <div
                    key={hit.id}
                    className={`map-hit ${isSelected ? "on" : ""}`}
                    onClick={() => handleSelect(hit.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <img src={hit.image} alt={hit.title} loading="lazy" />
                    <div>
                      <b>{hit.title}</b>
                      <span>{hit.specs}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="map-draw">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 16.5V5.5A1.5 1.5 0 0 1 5.5 4h13" />
                <path d="m14 2.5 4.5 3-4.5 3" />
                <circle cx="5" cy="19" r="2.2" />
                <path d="M8 19h11.5" />
              </svg>
              Custom boundary · 3.2 km across
            </p>
          </aside>

          <div className="map-canvas">
            <svg
              className="basemap"
              viewBox="0 0 1000 620"
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label="Stylised map of a New Cairo district with property markers."
            >
              <defs>
                <pattern
                  id="blocks"
                  width="52"
                  height="42"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="34" height="25" rx="3" fill="#E4DECF" />
                </pattern>
                <pattern
                  id="blocks2"
                  width="44"
                  height="36"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="27" height="20" rx="3" fill="#E7E1D3" />
                </pattern>
              </defs>

              <rect width="1000" height="620" fill="#EDE9DF" />

              {/* urban grain */}
              <rect x="60" y="40" width="380" height="240" fill="url(#blocks)" />
              <rect x="560" y="60" width="380" height="200" fill="url(#blocks2)" />
              <rect x="80" y="360" width="300" height="220" fill="url(#blocks2)" />
              <rect x="620" y="380" width="330" height="200" fill="url(#blocks)" />

              {/* parkland */}
              <path
                d="M430 300q60-40 130-20t120 10 90-30v130q-70 34-150 20t-140-6-50-24z"
                fill="#D9E3D4"
              />
              <circle cx="180" cy="318" r="46" fill="#D9E3D4" />

              {/* water */}
              <path
                d="M470 372q70 26 140 12t120-16v44q-64 22-136 16t-124-24z"
                fill="#C7D6E3"
              />

              {/* road casings then roads */}
              <g stroke="#DCD5C4" fill="none" strokeLinecap="round">
                <path d="M0 300h1000" strokeWidth="26" />
                <path d="M500 0v620" strokeWidth="22" />
                <path
                  d="M-20 120C220 96 300 220 520 210s360-120 520-96"
                  strokeWidth="18"
                />
              </g>
              <g stroke="#FFFFFF" fill="none" strokeLinecap="round">
                <path d="M0 300h1000" strokeWidth="18" />
                <path d="M500 0v620" strokeWidth="14" />
                <path
                  d="M-20 120C220 96 300 220 520 210s360-120 520-96"
                  strokeWidth="11"
                />
                <g strokeWidth="6" opacity=".92">
                  <path d="M150 0v300M300 0v300M700 300v320M850 60v240" />
                  <path d="M0 180h500M500 460h500M0 470h380" />
                </g>
              </g>

              {/* drawn search boundary */}
              <path
                d="M250 150 L640 120 L780 330 L560 500 L230 430 Z"
                fill="rgba(198,151,73,.13)"
                stroke="#C69749"
                strokeWidth="2.5"
                strokeDasharray="9 7"
                strokeLinejoin="round"
              />

              <g
                style={{ fontFamily: "var(--sans)" }}
                fontSize="12.5"
                fill="#6E7690"
                letterSpacing="1.4"
              >
                <text x="120" y="86">
                  FIFTH SETTLEMENT
                </text>
                <text x="610" y="104">
                  GOLDEN SQUARE
                </text>
                <text x="118" y="546">
                  KATAMEYA
                </text>
                <text x="676" y="556">
                  MIVIDA
                </text>
              </g>
            </svg>

            {/* Floating Inspect Card */}
            {inspectOpen && (
              <div
                className={`map-pop ${selectedHit.flip ? "flip-down" : ""}`}
                id="mapInspectCard"
                style={{
                  insetInlineStart: selectedHit.pinX,
                  insetBlockStart: selectedHit.pinY,
                  display: "block",
                }}
              >
                <div className="map-pop-inner">
                  <div className="map-pop-media">
                    <span className="map-pop-dev-badge" id="mapPopDev">
                      {selectedHit.developer}
                    </span>
                    <button
                      type="button"
                      className="map-pop-close"
                      id="mapPopClose"
                      aria-label="Dismiss inspect card"
                      onClick={() => setInspectOpen(false)}
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <img
                      id="mapPopImg"
                      src={selectedHit.image}
                      alt={selectedHit.title}
                      loading="lazy"
                    />
                  </div>
                  <div className="map-pop-body">
                    <b id="mapPopTitle">{selectedHit.title}</b>
                    <span id="mapPopSpecs">
                      {selectedHit.specs} · {selectedHit.sqmPrice}
                    </span>
                    <div className="map-pop-footer">
                      <span className="map-pop-price" id="mapPopPrice">
                        {selectedHit.price}
                      </span>
                      <Link href="/search" className="map-pop-action">
                        View unit →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6 Interactive Map Pins */}
            {hits.map((hit) => {
              const isVisible = activeTag === "all" || hit.tags.includes(activeTag);
              const isSelected = selectedIndex === hit.id;
              return (
                <div
                  key={hit.id}
                  className={`pin ${isSelected ? "on" : ""}`}
                  data-index={hit.id}
                  data-flip={hit.flip}
                  style={{
                    insetInlineStart: hit.pinX,
                    insetBlockStart: hit.pinY,
                    display: isVisible ? "block" : "none",
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(hit.id);
                  }}
                >
                  <b>{hit.pinLabel}</b>
                </div>
              );
            })}

            <div className="map-zoom">
              <button type="button" aria-label="Zoom in">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
              <button type="button" aria-label="Zoom out">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
            <span className="map-scale">500 m</span>
          </div>
        </div>
      </div>
    </section>
  );
}
