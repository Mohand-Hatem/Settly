"use client";

import React, { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapTilerTileUrl, MAPTILER_ATTRIBUTION } from "@/lib/maptiler";

export interface DistrictMapItem {
  id: string;
  slug: string;
  nameEn: string;
  lat: number;
  lng: number;
  avgPricePerSqm: number;
  region: string;
}

interface AreaRadarMapProps {
  districts: DistrictMapItem[];
  selectedSlug: string | null;
  onSelectDistrict: (slug: string) => void;
}

type LeafletModule = typeof Leaflet;

// Pixel padding for fitBounds so pills centred on edge coordinates are not clipped
// by the rounded, overflow-hidden map container (half a pill's max width / height).
const LABEL_PADDING: [number, number] = [120, 40];

function buildPinElement(d: DistrictMapItem, selected: boolean): HTMLElement {
  const pin = document.createElement("div");
  pin.className = selected ? "area-pin on" : "area-pin";
  pin.dataset.slug = d.slug;
  // textContent, not an HTML string: names may come from the database
  const name = document.createElement("span");
  name.textContent = d.nameEn;
  const price = document.createElement("b");
  price.textContent = `${Math.round(d.avgPricePerSqm / 1000)}k`;
  pin.append(name, price);
  return pin;
}

export function AreaRadarMap({
  districts,
  selectedSlug,
  onSelectDistrict,
}: AreaRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<{ L: LeafletModule; map: Leaflet.Map } | null>(null);
  const markersRef = useRef<Record<string, Leaflet.Marker>>({});
  // Latest values read from inside Leaflet handlers, so the map never rebuilds for them
  const onSelectRef = useRef(onSelectDistrict);
  onSelectRef.current = onSelectDistrict;
  const selectedSlugRef = useRef(selectedSlug);
  selectedSlugRef.current = selectedSlug;

  // Create the map once; Leaflet is imported lazily because it touches `window`
  useEffect(() => {
    let cancelled = false;
    let map: Leaflet.Map | null = null;

    import("leaflet").then(({ default: L }) => {
      if (cancelled || !mapContainerRef.current) return;
      map = L.map(mapContainerRef.current, {
        center: [30.03, 31.45],
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });
      // MapTiler everywhere in V1 (#96)
      L.tileLayer(mapTilerTileUrl(), { maxZoom: 19, attribution: MAPTILER_ATTRIBUTION }).addTo(map);
      setLeaflet({ L, map });
    });

    return () => {
      cancelled = true;
      map?.remove();
      markersRef.current = {};
      setLeaflet(null);
    };
  }, []);

  // Sync markers with the (filtered) district list
  useEffect(() => {
    if (!leaflet) return;
    const { L, map } = leaflet;
    const layer = L.layerGroup().addTo(map);
    const markers: Record<string, Leaflet.Marker> = {};

    districts.forEach((d) => {
      const isSelected = d.slug === selectedSlugRef.current;
      const icon = L.divIcon({
        className: "custom-area-pin-wrapper",
        html: buildPinElement(d, isSelected),
        // Zero-size anchor at the coordinate; .area-pin centres itself with a transform
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const marker = L.marker([d.lat, d.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : 0,
      }).addTo(layer);
      marker.on("click", () => onSelectRef.current(d.slug));
      markers[d.slug] = marker;
    });
    markersRef.current = markers;

    const all = Object.values(markers);
    if (all.length > 0) {
      map.fitBounds(L.featureGroup(all).getBounds(), {
        paddingTopLeft: LABEL_PADDING,
        paddingBottomRight: LABEL_PADDING,
        maxZoom: 12,
      });
    }

    return () => {
      layer.remove();
    };
  }, [leaflet, districts]);

  // Highlight and pan to the selected district without rebuilding markers
  useEffect(() => {
    if (!leaflet) return;
    Object.entries(markersRef.current).forEach(([slug, marker]) => {
      const isSelected = slug === selectedSlug;
      marker.setZIndexOffset(isSelected ? 1000 : 0);
      marker.getElement()?.querySelector(".area-pin")?.classList.toggle("on", isSelected);
    });

    const target = selectedSlug ? markersRef.current[selectedSlug] : undefined;
    if (target) {
      leaflet.map.panTo(target.getLatLng(), { animate: true, duration: 0.6 });
    }
  }, [leaflet, selectedSlug]);

  return (
    <div className="area-map-container">
      <div ref={mapContainerRef} className="area-gis-map-frame" />
      <div className="area-map-legend">
        <div className="legend-item">
          <span className="legend-dot bg-brass" />
          <span>Prime Corridor Nodes</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot bg-navy-900" />
          <span>EGP/m² Micro-Market Benchmark</span>
        </div>
      </div>
    </div>
  );
}
