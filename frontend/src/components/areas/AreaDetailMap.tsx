"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export interface CompoundPerimeter {
  name: string;
  developer: string;
  rate: string;
  coords: [number, number];
  poly: [number, number][];
  color: string;
}

interface AreaDetailMapProps {
  center: [number, number];
  zoom?: number;
  compounds: CompoundPerimeter[];
}

export function AreaDetailMap({
  center,
  zoom = 14,
  compounds,
}: AreaDetailMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 18,
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Draw compound perimeters and markers
      compounds.forEach((comp) => {
        // Draw Polygon Perimeter
        L.polygon(comp.poly, {
          color: comp.color,
          weight: 2,
          dashArray: "4, 4",
          fillColor: comp.color,
          fillOpacity: 0.12,
        }).addTo(map);

        // Add Custom Pin
        const pinIcon = L.divIcon({
          className: "settly-corridor-pin-wrapper",
          html: `<div style="background:#131D36; color:#fff; border:1.5px solid #C69749; border-radius:16px; padding:3px 9px; font-family:'JetBrains Mono',monospace; font-size:11px; font-weight:700; white-space:nowrap; box-shadow:0 4px 12px rgba(0,0,0,0.22); cursor:pointer;"><b>${comp.name}</b> · ${comp.rate}</div>`,
          iconSize: [140, 28],
          iconAnchor: [70, 14],
        });

        const marker = L.marker(comp.coords, { icon: pinIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family:'Plus Jakarta Sans',sans-serif; padding:4px 2px;">
            <b style="font-size:13px; color:#131D36; display:block; margin-bottom:2px;">${comp.name}</b>
            <span style="font-size:11px; color:#64748B; display:block;">Master Developer: ${comp.developer}</span>
            <span style="font-family:'JetBrains Mono',monospace; font-size:11.5px; font-weight:700; color:#C69749; display:block; margin-top:4px;">${comp.rate} Benchmark</span>
          </div>
        `);
      });
    }

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, compounds]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#F7F6F3",
        minHeight: "360px",
      }}
    />
  );
}
