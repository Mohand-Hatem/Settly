import React from "react";
import Link from "next/link";

export function MarketInsightsDeck() {
  const articles = [
    {
      id: "buying-guide",
      category: "Buying guide",
      title: "Reading a payment plan before you sign it",
      description:
        "Down payment, instalment length, maintenance deposit and delivery penalty: the four numbers that decide what a unit really costs.",
      readTime: "8 min read",
      image: "/images/1.jpg",
      alt: "Residential exterior with landscaped garden.",
    },
    {
      id: "market",
      category: "Market",
      title: "Why price per square metre beats sticker price",
      description:
        "Two villas at the same headline figure can differ by a third once you divide by built area. Here's how to run the comparison.",
      readTime: "6 min read",
      image: "/images/3.jpg",
      alt: "Landscaped courtyard with seating and mature planting.",
    },
    {
      id: "areas",
      category: "Areas",
      title: "New Cairo, Zayed or Sahel: what you're choosing",
      description:
        "Commute, delivery timelines and resale behave differently in each region. A side-by-side breakdown for first-time buyers.",
      readTime: "11 min read",
      image: "/images/6.jpg",
      alt: "Contemporary house exterior at golden hour.",
    },
    {
      id: "finishing",
      category: "Finishing",
      title: "Core & shell vs fully finished: true finishing costs",
      description:
        "Why semi-finished units often add 35% to your total cash outlay before handover, and how to verify contractor bids.",
      readTime: "7 min read",
      image: "/images/8.jpg",
      alt: "Luxury contemporary interior with marble and wood finishes.",
    },
    {
      id: "legal-resale",
      category: "Legal & Resale",
      title: "Primary vs resale: developer transfer fees & taxes",
      description:
        "Masareef tanozoul, real estate disposal tax, and maintenance deposits explained in plain numbers before negotiation.",
      readTime: "9 min read",
      image: "/images/10.jpg",
      alt: "Architectural villa exterior with geometric lines.",
    },
  ];

  return (
    <section className="sect" id="insights">
      <div className="wrap">
        <div className="shead shead-row" style={{ maxWidth: "none" }}>
          <div style={{ maxWidth: "52ch" }}>
            <h2>Market insights</h2>
            <p>
              Plain-language guides to buying in Egypt: what the terms mean and
              what the numbers do.
            </p>
          </div>
          <div className="insights-header-meta">
            <span className="spread-hint-badge">
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
                <path d="m15 15 6 6m-6-6v4.8m0-4.8h4.8" />
                <path d="M9 19.8V15m0 0H4.2M9 15l-6 6" />
                <path d="M15 4.2V9m0 0h4.8M15 9l6-6" />
                <path d="M9 4.2V9m0 0H4.2M9 9 3 3" />
              </svg>
              Hover deck to spread
            </span>
            <Link className="slink" href="/market-insights">
              All articles
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
        </div>
        <div className="card-spread-stage">
          <div className="card-spread-deck">
            {articles.map((item) => (
              <Link
                key={item.id}
                href={`/market-insights#${item.id}`}
                className="card-spread-card"
              >
                <div className="card-spread-media">
                  <span className="card-cat-badge">{item.category}</span>
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                  />
                </div>
                <div className="card-spread-body">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="card-spread-footer">
                    <span>{item.readTime}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
