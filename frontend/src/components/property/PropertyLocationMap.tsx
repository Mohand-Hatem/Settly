"use client";

import React from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { hasMapTilerKey, mapTilerTileUrl, MAPTILER_ATTRIBUTION } from "@/lib/maptiler";
import { isValidLatLng } from "@/lib/geo";

const pin = L.divIcon({
  className: "",
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#C69749;border:3px solid #131D36;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/** Property location map (MAP-04): Leaflet + MapTiler (#96). Falls back to text when unavailable. */
export default function PropertyLocationMap({
  latitude,
  longitude,
  label,
}: {
  latitude: number;
  longitude: number;
  label: string;
}) {
  if (!hasMapTilerKey || !isValidLatLng(latitude, longitude)) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-line bg-canvas-2 p-6 text-center text-sm text-ink-2">
        The map is unavailable right now. Location: {label}
      </div>
    );
  }
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%", borderRadius: 12 }}
    >
      <TileLayer url={mapTilerTileUrl()} attribution={MAPTILER_ATTRIBUTION} maxZoom={20} />
      <Marker position={[latitude, longitude]} icon={pin} title={label} />
    </MapContainer>
  );
}
