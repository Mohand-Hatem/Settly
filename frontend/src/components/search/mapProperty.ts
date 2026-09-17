import type { PropertyResponse } from "@/api/catalog";
import { PLACEHOLDER_PROPERTY_IMAGE } from "@/lib/images";
import { piastresToEgp } from "@/lib/money";
import type { PropertyItem } from "./PropertyCard";

// The API has no developer field yet; the search facets group by these names
function inferDeveloper(title: string, desc: string, areaName: string): string {
  const combined = `${title} ${desc} ${areaName}`.toLowerCase();
  if (combined.includes("palm hills") || combined.includes("lake view") || combined.includes("palm court")) {
    return "Palm Hills";
  }
  if (combined.includes("sodic") || combined.includes("villette") || combined.includes("karmell")) {
    return "SODIC";
  }
  if (
    combined.includes("emaar") ||
    combined.includes("mivida") ||
    combined.includes("marassi") ||
    combined.includes("azure")
  ) {
    return "Emaar Misr";
  }
  if (combined.includes("ora") || combined.includes("zed")) {
    return "Ora Developers";
  }
  if (combined.includes("katameya")) {
    return "Katameya";
  }
  return "Settly Verified";
}

function formatShortPrice(egp: number): string {
  return egp >= 1_000_000 ? `${(egp / 1_000_000).toFixed(1)}M` : `${(egp / 1000).toFixed(0)}K`;
}

/**
 * Maps an API property onto the search card/map view model.
 *
 * Coordinates are passed through untouched: a listing with an invalid position still
 * appears in the results list but is left off the map (see SearchMap), rather than being
 * pinned to a made-up location. Financing fields (finish, plan, installment, handover)
 * are not in the API yet and remain illustrative, as the site-wide banner states.
 */
export function toPropertyItem(p: PropertyResponse): PropertyItem {
  const priceNum = piastresToEgp(p.price);
  const sqmPriceNum = p.areaSqm > 0 ? Math.round(priceNum / p.areaSqm) : 0;
  const areaName = p.area?.nameEn || "Egypt";
  const rawType = p.propertyType.toLowerCase();
  const cover = p.images.find((img) => img.isCover) ?? p.images[0];

  return {
    id: p.id,
    slug: p.slug,
    dev: inferDeveloper(p.titleEn || "", p.descriptionEn || "", areaName),
    title: p.titleEn || "Untitled residence",
    specs: `${areaName} · ${p.areaSqm} m² · ${p.bedrooms} beds · EGP ${sqmPriceNum.toLocaleString()}/m²`,
    price: `EGP ${priceNum.toLocaleString()}`,
    priceNum,
    priceShort: formatShortPrice(priceNum),
    sqmPrice: `EGP ${sqmPriceNum.toLocaleString()} / m²`,
    img: cover?.url || PLACEHOLDER_PROPERTY_IMAGE,
    lat: p.latitude,
    lng: p.longitude,
    inGoldenSquare: areaName.toLowerCase().includes("golden square"),
    type: rawType === "townhouse" ? "town" : rawType,
    location:
      areaName.includes("Cairo") || areaName.includes("Square") ? `${areaName}, New Cairo` : areaName,
    finish: "Fully Finished",
    plan: "7-Yr Plan",
    downPayment: `10% (${((priceNum * 0.1) / 1_000_000).toFixed(2)}M)`,
    installment: `EGP ${Math.round((priceNum * 0.9) / 28).toLocaleString()} / qtr`,
    interest: "0% Int.",
    beds: p.bedrooms,
    baths: p.bathrooms,
    bua: p.areaSqm,
    plotOrTerrace: `${Math.round(p.areaSqm * 1.3)} m²`,
    handover: "Q4 2026",
    amenities: p.amenities.map((a) => a.nameEn),
    subLocation: areaName,
  };
}
