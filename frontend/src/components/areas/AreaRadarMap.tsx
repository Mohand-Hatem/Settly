"use client";

import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

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

export function AreaRadarMap({
  districts,
  selectedSlug,
  onSelectDistrict,
}: AreaRadarMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    let isMounted = true;

    async function init() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;
      if (!isMounted) return;

      // Center around Greater Cairo / Eastern Egypt
      const defaultCenter: [number, number] = [30.03, 31.45];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 11,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Plot initial markers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const markerGroup: any[] = [];
      districts.forEach((d) => {
        const icon = L.divIcon({
          className: "custom-area-pin-wrapper",
          html: `<div class="area-pin ${selectedSlug === d.slug ? "on" : ""}" data-slug="${d.slug}">
            <span>${d.nameEn}</span>
            <b>${Math.round(d.avgPricePerSqm / 1000)}k</b>
          </div>`,
          iconSize: [110, 32],
          iconAnchor: [55, 16],
        });

        const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);
        marker.on("click", () => {
          onSelectDistrict(d.slug);
        });

        markersRef.current[d.slug] = marker;
        markerGroup.push(marker);
      });

      if (markerGroup.length > 0) {
        const group = L.featureGroup(markerGroup);
        map.fitBounds(group.getBounds().pad(0.2));
      }
    }

    init();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [districts, onSelectDistrict, selectedSlug]);

  // Highlight selected pin
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    Object.entries(markersRef.current).forEach(([slug, marker]) => {
      const el = marker.getElement();
      if (el) {
        const pin = el.querySelector(".area-pin");
        if (pin) {
          if (slug === selectedSlug) {
            pin.classList.add("on");
          } else {
            pin.classList.remove("on");
          }
        }
      }
    });

    if (selectedSlug && markersRef.current[selectedSlug]) {
      const targetMarker = markersRef.current[selectedSlug];
      mapInstanceRef.current.panTo(targetMarker.getLatLng(), { animate: true, duration: 0.6 });
    }
  }, [selectedSlug]);

  return (
    <div className="area-map-container">
      <div ref={mapContainerRef} className="area-gis-map-frame" />
      <div className="area-map-legend">
        <div className="legend-item">
          <span className="legend-dot bg-[#C69749]" />
          <span>Prime Corridor Nodes</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot bg-[#131D36]" />
          <span>EGP/m² Micro-Market Benchmark</span>
        </div>
      </div>
    </div>
  );
}
