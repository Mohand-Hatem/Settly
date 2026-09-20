import React from "react";
import Image from "next/image";
import Link from "next/link";

export function MetricsPillars() {
  return (
    <section className="sect">
      <div className="wrap split">
        <div className="split-media">
          <Image
            src="/images/10.jpg"
            alt="Minimal cubic residence at dusk with warm interior light behind full-height glazing."
            width={800}
            height={670}
            sizes="(max-width: 900px) 100vw, 50vw"
            loading="lazy"
          />
          <div className="split-stat">
            <b className="num">EGP 60,185 / m²</b>
            <span>the number every listing carries</span>
          </div>
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)" }}>
            Priced in metrics, not adjectives.
          </h2>
          <div className="checks">
            <div className="check">
              <div className="check-ico">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4>Every listing is moderated</h4>
                <p>
                  Nothing reaches the index before an admin has reviewed it and
                  the agent&apos;s identity is verified.
                </p>
              </div>
            </div>
            <div className="check">
              <div className="check-ico">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4>Comparable by square metre</h4>
                <p>
                  Area and price per m² are structured fields, so a Sahel
                  penthouse and a Zayed duplex sit on one scale.
                </p>
              </div>
            </div>
            <div className="check">
              <div className="check-ico">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4>The negotiation is on the record</h4>
                <p>
                  Offers, counters and acceptances are logged with timestamps,
                  so nothing rests on a disputed phone call.
                </p>
              </div>
            </div>
            <div className="check">
              <div className="check-ico">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 13 4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4>The deposit is confirmed by the bank, not the browser</h4>
                <p>
                  A reservation is only reserved once the payment provider
                  confirms it. No optimistic states.
                </p>
              </div>
            </div>
          </div>
          <Link className="btn btn-primary" href="/terms">
            See how a purchase works
          </Link>
        </div>
      </div>
    </section>
  );
}
