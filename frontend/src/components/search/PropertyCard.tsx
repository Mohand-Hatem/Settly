"use client";

import React from "react";
import Link from "next/link";

export interface PropertyItem {
  id: string;
  slug?: string;
  dev: string;
  title: string;
  specs: string;
  price: string;
  priceNum: number;
  priceShort: string;
  sqmPrice: string;
  img: string;
  lat: number;
  lng: number;
  inGoldenSquare: boolean;
  type: string;
  location: string;
  finish: string;
  plan: string;
  downPayment: string;
  installment: string;
  interest: string;
  beds: number;
  baths: number;
  bua: number;
  plotOrTerrace: string;
  handover: string;
  amenities: string[];
  subLocation: string;
}

interface PropertyCardProps {
  property: PropertyItem;
  isSelected?: boolean;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export function PropertyCard({
  property,
  isSelected,
  onHover,
  onClick,
  isFavorite,
  onToggleFavorite,
}: PropertyCardProps) {
  return (
    <article
      className={`prop ${isSelected ? "hover-selected" : ""}`}
      data-prop-id={property.id}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
      onClick={() => onClick?.(property.id)}
    >
      <div className="prop-media">
        <img
          src={property.img}
          alt={property.title}
          loading="lazy"
        />

        {/* Top-Left Badges (Never overlaps with heart button) */}
        <div className="prop-tags">
          <span className="tag tag-dev">{property.dev}</span>
          <span className="tag tag-ok">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="m5 13 4 4L19 7" />
            </svg>
            Verified
          </span>
        </div>

        {/* Top-Right Favorite Heart */}
        <button
          type="button"
          className={`prop-favorite-btn ${isFavorite ? "saved" : ""}`}
          aria-label={isFavorite ? "Remove from favorites" : "Save property"}
          title="Save to favorites"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(property.id);
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>

        <span className="prop-sqm">{property.sqmPrice}</span>
      </div>

      <div className="prop-body">
        <div className="prop-loc-bar">
          <span className="prop-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.4" />
            </svg>
            {property.location}
          </span>
          <span className="prop-finish-pill">{property.finish}</span>
        </div>

        <h3>{property.title}</h3>

        <div className="prop-price-wrap">
          <p className="prop-price">
            {property.price.replace("EGP ", "")}
            <small>EGP</small>
          </p>
          <span className="prop-plan-chip">{property.plan}</span>
        </div>

        <div className="prop-finance-sub">
          <span>
            Down: <b>{property.downPayment}</b>
          </span>
          <span>·</span>
          <span>
            Installment: <b>{property.installment}</b>
          </span>
          <span>·</span>
          <span>
            <b>{property.interest}</b>
          </span>
        </div>

        <div className="prop-specs-grid">
          <div className="spec-cell">
            <span className="spec-cell-val">{property.beds} Beds</span>
            <span className="spec-cell-lbl">Bedrooms</span>
          </div>
          <div className="spec-cell">
            <span className="spec-cell-val">{property.baths} Baths</span>
            <span className="spec-cell-lbl">Bathrooms</span>
          </div>
          <div className="spec-cell">
            <span className="spec-cell-val">{property.bua} m²</span>
            <span className="spec-cell-lbl">Built Area</span>
          </div>
          <div className="spec-cell">
            <span className="spec-cell-val">{property.plotOrTerrace}</span>
            <span className="spec-cell-lbl">
              {property.plotOrTerrace.includes("Plot") ||
              property.plotOrTerrace.includes("m²")
                ? "Land Plot"
                : "Spec"}
            </span>
          </div>
        </div>

        <div className="prop-status-row">
          <span>
            Handover: <b>{property.handover}</b>
          </span>
          <span className="prop-audit-seal">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            CAD Audited
          </span>
        </div>

        <div className="prop-amenities-row">
          {property.amenities.map((amenity, idx) => (
            <span key={idx} className="amenity-chip">
              {amenity}
            </span>
          ))}
        </div>

        <div className="prop-footer-action">
          <span
            style={{
              fontFamily: "var(--mono-ui)",
              fontSize: "11px",
              color: "var(--ink-3)",
            }}
          >
            {property.subLocation}
          </span>
          <Link
            href={`/properties/${property.slug || property.id}`}
            className="prop-view-link"
            onClick={(e) => e.stopPropagation()}
          >
            Explore unit
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
