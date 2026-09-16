import React from "react";
import Image from "next/image";
import Link from "next/link";

export function CuratedCollections() {
  const residences = [
    {
      id: "lake-view-signature-villa",
      title: "Lake View Signature Villa",
      developer: "Palm Hills",
      location: "Golden Square, New Cairo",
      price: "32,500,000",
      sqmPrice: "EGP 60,185 / m²",
      plan: "7-Yr Plan",
      beds: 5,
      baths: 6,
      sqm: 540,
      image: "/images/11.jpg",
    },
    {
      id: "terrace-skyline-duplex",
      title: "Terrace Skyline Duplex",
      developer: "SODIC",
      location: "Karmell, Sheikh Zayed",
      price: "18,900,000",
      sqmPrice: "EGP 59,060 / m²",
      plan: "8-Yr Plan",
      beds: 4,
      baths: 4,
      sqm: 320,
      image: "/images/5.jpg",
    },
    {
      id: "azure-horizon-penthouse",
      title: "Azure Horizon Penthouse",
      developer: "Emaar Misr",
      location: "Sidi Abd El Rahman, North Coast",
      price: "44,000,000",
      sqmPrice: "EGP 107,317 / m²",
      plan: "6-Yr Plan",
      beds: 4,
      baths: 5,
      sqm: 410,
      image: "/images/2.jpg",
    },
    {
      id: "courtyard-townhouse",
      title: "Courtyard Townhouse",
      developer: "Ora Developers",
      location: "ZED East, New Cairo",
      price: "21,400,000",
      sqmPrice: "EGP 75,087 / m²",
      plan: "7-Yr Plan",
      beds: 3,
      baths: 4,
      sqm: 285,
      image: "/images/9.jpg",
    },
  ];

  return (
    <section className="sect" id="areas" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="shead shead-row" style={{ maxWidth: "none" }}>
          <div style={{ maxWidth: "52ch" }}>
            <h2>Featured residences</h2>
            <p>
              A sample of what an indexed listing looks like: verified area,
              developer, and the metric that lets you compare across compounds.
            </p>
          </div>
          <Link className="slink" href="/search">
            Browse all listings
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </Link>
        </div>

        <div className="props">
          {residences.map((res) => (
            <article key={res.id} className="prop">
              <div className="prop-media">
                <Image
                  src={res.image}
                  alt={res.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  style={{ objectFit: "cover" }}
                  loading="lazy"
                />
                <div className="prop-tags">
                  <span className="tag tag-dev">{res.developer}</span>
                  <span className="tag tag-ok">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                </div>
                <span className="prop-sqm">{res.sqmPrice}</span>
              </div>
              <div className="prop-body">
                <p className="prop-loc">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.4" />
                  </svg>
                  {res.location}
                </p>
                <h3>
                  <Link href={`/properties/${res.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {res.title}
                  </Link>
                </h3>
                <div className="prop-price-wrap">
                  <p className="prop-price">
                    {res.price}
                    <small>EGP</small>
                  </p>
                  <span className="prop-plan-chip">{res.plan}</span>
                </div>
                <div className="prop-specs">
                  <span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M3 18v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5" />
                      <path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
                      <path d="M3 18h18" />
                    </svg>
                    {res.beds} Beds
                  </span>
                  <span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
                      <path d="M7 12V6a2 2 0 0 1 4 0" />
                    </svg>
                    {res.baths} Baths
                  </span>
                  <span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16v16H4z" />
                      <path d="M4 10h6V4" />
                    </svg>
                    {res.sqm} m²
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
