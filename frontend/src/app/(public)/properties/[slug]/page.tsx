import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { PropertyResponse } from "@/api/catalog";
import { PropertyDetailClient } from "./PropertyDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Public property page (spec S1-08). ISR — no per-user cookies are read here (FRONTEND.md §2);
 * everything personal (own listing, verification, viewing request) happens client-side.
 * A missing or non-public listing is a 404: there is no placeholder listing.
 */
async function getProperty(slug: string): Promise<PropertyResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/properties/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PropertyResponse;
    return data.status === "PUBLISHED" || data.status === "RESERVED" ? data : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return { title: "Property not found | Settly" };
  const title = `${property.titleEn ?? "Property"}${property.area ? ` — ${property.area.nameEn}` : ""} | Settly`;
  const description = property.descriptionEn?.slice(0, 160) ?? undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: property.images[0] ? [{ url: property.images[0].url, alt: title }] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) notFound();
  return <PropertyDetailClient property={property} />;
}
