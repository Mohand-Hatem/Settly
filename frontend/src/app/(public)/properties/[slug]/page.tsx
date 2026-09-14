import React from "react";
import type { Metadata } from "next";
import { PropertyDetailClient, PropertyDetailData } from "./PropertyDetailClient";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function getPropertyData(slug: string): Promise<PropertyDetailData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/properties/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data) return null;

    // Convert backend schema (piastres string to EGP integer, etc.)
    const priceEgp = data.price ? Number(BigInt(data.price) / 100n) : 32500000;

    return {
      id: data.id,
      slug: data.slug,
      titleEn: data.titleEn || "Luxury Residence",
      titleAr: data.titleAr,
      descriptionEn: data.descriptionEn,
      descriptionAr: data.descriptionAr,
      propertyType: data.propertyType || "VILLA",
      listingIntent: data.listingIntent || "SALE",
      price: priceEgp,
      currency: "EGP",
      bedrooms: data.bedrooms || 5,
      bathrooms: data.bathrooms || 6,
      areaSqm: data.areaSqm || 540,
      landAreaSqm: data.landAreaSqm || 720,
      developer: data.developer || "Master Developer",
      project: data.project || "Signature Enclave",
      areaName: data.area?.nameEn || "New Cairo",
      district: data.area?.parent?.nameEn || "Golden Square",
      referenceCode: `SET-${slug.slice(0, 7).toUpperCase()}`,
      finishingType: "Fully Finished — Ultra Luxury",
      deliveryYear: 2026,
      latitude: data.latitude || 30.0155,
      longitude: data.longitude || 31.4880,
      images: data.images?.length
        ? data.images.map((img: { id: string; url: string; isCover?: boolean }) => ({
            id: img.id,
            url: img.url,
            isCover: img.isCover,
          }))
        : [
            { id: "1", url: "/images/1.jpg", isCover: true },
            { id: "2", url: "/images/3.jpg" },
            { id: "3", url: "/images/4.jpg" },
            { id: "4", url: "/images/7.jpg" },
          ],
      amenities: data.amenities?.length
        ? data.amenities.map((a: { id: string; nameEn: string; nameAr?: string | null; category: string; icon?: string | null }) => ({
            id: a.id,
            nameEn: a.nameEn,
            nameAr: a.nameAr,
            category: a.category,
            icon: a.icon,
          }))
        : [],
      agent: data.agent
        ? {
            id: data.agent.id,
            name: data.agent.name,
            email: data.agent.email,
            image: data.agent.image || "/images/phone.jpg",
            licenseNumber: data.agent.licenseNumber || "EG-LIC-78921",
            brokerageName: data.agent.brokerageName || "Senior Real Estate Advisor",
            dealsCount: 64,
          }
        : undefined,
    };
  } catch {
    // Graceful fallback to null when backend is offline
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const property = await getPropertyData(slug);

  const title = property
    ? `${property.titleEn} — Golden Square, New Cairo | Settly`
    : "Lake View Signature Villa — Golden Square, New Cairo | Settly";

  const description = property?.descriptionEn
    ? property.descriptionEn.slice(0, 160)
    : "Verified luxury villa with direct developer allocation, 7-year payment schedule, and audited escrow account in New Cairo.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: property?.images?.[0]?.url || "/images/1.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
  };
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const property = await getPropertyData(slug);

  // If fetched property exists, pass it; otherwise PropertyDetailClient uses its luxury showcase default
  return <PropertyDetailClient initialProperty={property || undefined} />;
}
