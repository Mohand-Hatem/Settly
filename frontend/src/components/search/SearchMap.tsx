"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polygon,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { PropertyItem } from "./PropertyCard";

interface SearchMapProps {
  properties: PropertyItem[];
  selectedId: string | null;
  onSelectProperty: (id: string | null) => void;
  isMapOnlyMode?: boolean;
}

// Golden Square Corridor GIS Boundary (New Cairo)
const GOLDEN_SQUARE_COORDS: [number, number][] = [
  [30.032, 31.468],
  [30.035, 31.512],
  [30.021, 31.528],
  [30.002, 31.52],
  [29.998, 31.474],
  [30.014, 31.461],
  [30.032, 31.468],
];

// Child Controller component to handle map events, auto-resize, pan/zoom & coordinate tracking
function MapEventsController({
  activeProperty,
  isMapOnlyMode,
  isFlying,
  setIsFlying,
  setInspectPos,
  onSelectProperty,
  onMapReady,
}: {
  activeProperty: PropertyItem | null;
  isMapOnlyMode?: boolean;
  isFlying: boolean;
  setIsFlying: (flying: boolean) => void;
  setInspectPos: (
    pos: { x: number; y: number; flipDown: boolean } | null,
  ) => void;
  onSelectProperty: (id: string | null) => void;
  onMapReady: (map: L.Map) => void;
}) {
  const map = useMap();

  // Expose map instance to parent once mounted
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  // Handle map resizing when toggling between Split and Full Map mode
  useEffect(() => {
    const timer1 = setTimeout(() => map.invalidateSize(), 50);
    const timer2 = setTimeout(() => map.invalidateSize(), 250);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map, isMapOnlyMode]);

  // Handle dynamic container dimension changes (e.g. devtools, screen resize, orientation)
  useEffect(() => {
    const container = map.getContainer();
    if (!container || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [map]);

  // Update floating inspect card position based on active property coordinates
  const syncInspectCardPosition = React.useCallback(() => {
    if (
      !activeProperty ||
      !Number.isFinite(Number(activeProperty.lat)) ||
      !Number.isFinite(Number(activeProperty.lng))
    ) {
      setInspectPos(null);
      return;
    }
    const lat = Number(activeProperty.lat);
    const lng = Number(activeProperty.lng);
    const pt = map.latLngToContainerPoint([lat, lng]);
    const size = map.getSize();
    const halfCard = 145;
    const padding = 14;
    const clampedX = Math.max(
      halfCard + padding,
      Math.min(size.x - halfCard - padding, pt.x),
    );
    setInspectPos({
      x: clampedX,
      y: pt.y,
      flipDown: pt.y < 190,
    });
  }, [map, activeProperty, setInspectPos]);

  // Recalculate inspect card position cleanly without jitter during camera flights
  useMapEvents({
    move: () => {
      if (!isFlying) {
        syncInspectCardPosition();
      }
    },
    moveend: () => {
      setIsFlying(false);
      syncInspectCardPosition();
    },
    zoomend: () => {
      setIsFlying(false);
      syncInspectCardPosition();
    },
    click: (e) => {
      const target = e.originalEvent?.target as HTMLElement | null;
      if (target && target.closest(".pin")) return;
      onSelectProperty(null);
      setInspectPos(null);
    },
  });

  // Re-sync position whenever the selected property changes and not flying
  useEffect(() => {
    if (!isFlying) {
      syncInspectCardPosition();
    }
  }, [syncInspectCardPosition, isFlying]);

  return null;
}

export function SearchMap({
  properties,
  selectedId,
  onSelectProperty,
  isMapOnlyMode,
}: SearchMapProps) {
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [isLassoActive, setIsLassoActive] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const [inspectPos, setInspectPos] = useState<{
    x: number;
    y: number;
    flipDown: boolean;
  } | null>(null);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === selectedId) || null,
    [properties, selectedId],
  );

  // Memoize stable marker icons to prevent Leaflet marker destruction/flicker
  const markerIcons = useMemo(() => {
    const icons: Record<string, L.DivIcon> = {};
    properties.forEach((p) => {
      icons[p.id] = L.divIcon({
        className: "settly-leaflet-pin",
        html: `<div class="pin" id="pin-${p.id}"><b>${p.priceShort}</b></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    });
    return icons;
  }, [properties]);

  // Directly toggle .on class in DOM to avoid recreating Leaflet markers
  useEffect(() => {
    properties.forEach((p) => {
      const pinEl = document.getElementById(`pin-${p.id}`);
      if (pinEl) {
        pinEl.classList.toggle("on", p.id === selectedId);
      }
    });
  }, [selectedId, properties]);

  // New Cairo Golden Square default center
  const cairoCenter: [number, number] = [30.0155, 31.492];

  // Smooth in-car aerodynamic flight transition when property is selected
  useEffect(() => {
    if (
      activeProperty &&
      mapInstance &&
      Number.isFinite(Number(activeProperty.lat)) &&
      Number.isFinite(Number(activeProperty.lng))
    ) {
      const lat = Number(activeProperty.lat);
      const lng = Number(activeProperty.lng);
      setIsFlying(true);
      mapInstance.flyTo([lat, lng], 14.5, {
        animate: true,
        duration: 1.1,
        easeLinearity: 0.22,
      });
    }
  }, [activeProperty, mapInstance]);

  // Auto-scroll active card in the bottom tray into center view
  useEffect(() => {
    if (selectedId) {
      const cardEl = document.getElementById(`tray-card-${selectedId}`);
      if (cardEl) {
        cardEl.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [selectedId]);

  // Smooth cinematic flight back to Golden Square overview
  const handleResetBounds = () => {
    if (!mapInstance || properties.length === 0) return;
    const validCoords = properties
      .filter(
        (p) =>
          Number.isFinite(Number(p.lat)) &&
          Number.isFinite(Number(p.lng)) &&
          Math.abs(Number(p.lat)) > 1,
      )
      .map((p) => [Number(p.lat), Number(p.lng)] as [number, number]);

    if (validCoords.length === 0) return;
    setIsFlying(true);
    const bounds = L.latLngBounds(validCoords);
    mapInstance.flyToBounds(bounds, {
      padding: [60, 60],
      duration: 1.2,
      easeLinearity: 0.22,
    });
  };

  // Zoom controls with smooth animation
  const handleZoomIn = () => mapInstance?.zoomIn(1, { animate: true });
  const handleZoomOut = () => mapInstance?.zoomOut(1, { animate: true });

  return (
    <aside className="search-map-col">
      <div className="search-map-wrapper">
        <div
          id="mapCanvas"
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            inset: 0,
          }}
        >
          <MapContainer
            center={cairoCenter}
            zoom={13.5}
            zoomControl={false}
            attributionControl={false}
            scrollWheelZoom={true}
            style={{
              width: "100%",
              height: "100%",
              background: "var(--canvas-2)",
            }}
          >
            {/* High-resolution MapTiler luxury streets tiles with verified key and zero watermarks */}
            <TileLayer
              url="https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=FqlQw9LpyWPJ8S7SheRV"
              maxZoom={20}
              attribution="Settly GIS · &copy; MapTiler · &copy; OpenStreetMap"
            />

            {/* Cairo Golden Square Corridor Polygon */}
            {isLassoActive && (
              <Polygon
                positions={GOLDEN_SQUARE_COORDS}
                pathOptions={{
                  color: "#C69749",
                  weight: 2,
                  dashArray: "6, 6",
                  fillColor: "#C69749",
                  fillOpacity: 0.12,
                }}
              />
            )}

            {/* Custom Interactive HTML Pin Markers with Stable Icons */}
            {properties
              .filter(
                (p) =>
                  Number.isFinite(Number(p.lat)) &&
                  Number.isFinite(Number(p.lng)) &&
                  markerIcons[p.id],
              )
              .map((p) => (
                <Marker
                  key={p.id}
                  position={[Number(p.lat), Number(p.lng)]}
                  icon={markerIcons[p.id]}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      onSelectProperty(p.id);
                    },
                  }}
                />
              ))}

            {/* Map Event Controller */}
            <MapEventsController
              activeProperty={activeProperty}
              isMapOnlyMode={isMapOnlyMode}
              isFlying={isFlying}
              setIsFlying={setIsFlying}
              setInspectPos={setInspectPos}
              onSelectProperty={onSelectProperty}
              onMapReady={setMapInstance}
            />
          </MapContainer>
        </div>

        {/* Floating Map Tool Controls */}
        <div className="map-floating-bar">
          <button
            type="button"
            className={`map-tool-btn ${isLassoActive ? "active" : ""}`}
            id="btnDrawArea"
            title="Toggle Golden Square polygon boundary"
            onClick={() => setIsLassoActive((prev) => !prev)}
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
            </svg>
            <span>Draw boundary</span>
          </button>

          <button
            type="button"
            className="map-tool-btn"
            id="btnResetBounds"
            title="Fit map to all listings"
            onClick={handleResetBounds}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset view</span>
          </button>
        </div>

        {/* Automotive Cockpit Telemetry HUD & Prominent 44px Compass Instrument */}
        <div className="map-cockpit-hud" id="mapCockpitHud">
          <div
            className="map-cockpit-compass"
            title="Reset view to North & Golden Square overview"
            onClick={handleResetBounds}
            role="button"
            tabIndex={0}
            aria-label="Reset view to North & Golden Square overview"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleResetBounds();
              }
            }}
          >
            <div className="compass-needle" />
            <span className="compass-label">N</span>
          </div>
          <div className="map-cockpit-coords">
            <div className="coords-value">
              {activeProperty &&
              Number.isFinite(Number(activeProperty.lat)) &&
              Number.isFinite(Number(activeProperty.lng))
                ? `${Number(activeProperty.lat).toFixed(4)}° N · ${Number(activeProperty.lng).toFixed(4)}° E`
                : "30.0155° N · 31.4920° E"}
            </div>
          </div>
        </div>

        {/* Custom Zoom Controls */}
        <div className="map-custom-zoom">
          <button
            type="button"
            className="map-zoom-btn"
            id="mapZoomIn"
            aria-label="Zoom in"
            onClick={handleZoomIn}
          >
            +
          </button>
          <button
            type="button"
            className="map-zoom-btn"
            id="mapZoomOut"
            aria-label="Zoom out"
            onClick={handleZoomOut}
          >
            −
          </button>
        </div>

        {/* Floating Inspect Card anchored to Pin with Zero-Jitter Flight Transitions */}
        {activeProperty && inspectPos && (
          <div
            className={`map-pop ${isFlying ? "is-flying" : ""} ${
              inspectPos.flipDown ? "flip-down" : ""
            }`}
            id="mapInspectCard"
            style={{
              display: "block",
              position: "absolute",
              insetInlineStart: `${inspectPos.x}px`,
              insetBlockStart: `${inspectPos.y}px`,
              transform: inspectPos.flipDown
                ? "translate(-50%, 14px)"
                : "translate(-50%, calc(-100% - 14px))",
            }}
          >
            <div className="map-pop-inner">
              <div className="map-pop-media">
                <span className="map-pop-dev-badge">{activeProperty.dev}</span>
                <button
                  type="button"
                  className="map-pop-close"
                  id="mapPopClose"
                  aria-label="Dismiss inspect card"
                  onClick={() => {
                    onSelectProperty(null);
                    setInspectPos(null);
                  }}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                </button>
                <img
                  src={activeProperty.img}
                  alt={activeProperty.title}
                  loading="lazy"
                />
              </div>
              <div className="map-pop-body">
                <b>{activeProperty.title}</b>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--ink-3)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {activeProperty.specs}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: "6px",
                    borderTop: "1px solid var(--line)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--mono-ui)",
                      fontWeight: 700,
                      fontSize: "12px",
                      color: "var(--navy-900)",
                    }}
                  >
                    {activeProperty.price}
                  </span>
                  <Link
                    href={`/properties/${activeProperty.slug || activeProperty.id}`}
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "var(--brass-600)",
                      textDecoration: "none",
                    }}
                  >
                    View unit →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map-Only View Bottom Tray */}
        {isMapOnlyMode && (
          <div
            className="map-view-tray"
            id="mapViewTray"
            aria-label="Map listings tray"
          >
            {properties.map((p) => (
              <div
                key={p.id}
                className={`map-tray-card ${selectedId === p.id ? "active" : ""}`}
                id={`tray-card-${p.id}`}
                onClick={() => onSelectProperty(p.id)}
              >
                <img src={p.img} alt={p.title} loading="lazy" />
                <div className="map-tray-info">
                  <b>{p.title}</b>
                  <span>
                    {p.dev} · {p.specs.split("·")[0].trim()}
                  </span>
                  <span className="tray-price">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
