/**
 * MapTiler is the only tile provider in V1 (#96). The key comes from NEXT_PUBLIC_MAPTILER_KEY
 * (domain-restricted in the MapTiler dashboard) and is never hard-coded.
 */
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";

export const hasMapTilerKey = MAPTILER_KEY.length > 0;

export function mapTilerTileUrl(style: "streets-v2" | "dataviz" = "streets-v2"): string {
  return `https://api.maptiler.com/maps/${style}/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`;
}

export const MAPTILER_ATTRIBUTION = "&copy; MapTiler &copy; OpenStreetMap contributors";
