import React from "react";
import Image from "next/image";

export function MobileShowcase() {
  return (
    <section className="sect">
      <div className="wrap mob-grid">
        <div className="mob-media">
          <Image
            src="/images/phone.jpg"
            alt="A hand holding a phone showing the Settly property search."
            width={600}
            height={800}
            sizes="(max-width: 900px) 100vw, 50vw"
            loading="lazy"
          />
        </div>
        <div>
          <h2 style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)" }}>
            The whole of Settly, in one hand.
          </h2>
          <p
            style={{
              fontSize: "1.06rem",
              color: "var(--ink-2)",
              lineHeight: 1.68,
              marginTop: "1rem",
              maxWidth: "48ch",
            }}
          >
            Settly is one responsive site, not a stripped-down mobile companion.
            Every search, every viewing and every offer works the same on a
            phone as it does on a desktop.
          </p>
          <div className="mob-list">
            <div className="mob-item">
              <div className="mob-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              </div>
              <div>
                <h4>The map works on a phone</h4>
                <p>
                  Pan, draw and filter with your thumb, not a desktop-only
                  control squeezed onto a small screen.
                </p>
              </div>
            </div>
            <div className="mob-item">
              <div className="mob-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 14 18 8Z" />
                  <path d="M10.5 19a2 2 0 0 0 3 0" />
                </svg>
              </div>
              <div>
                <h4>Alerts reach you first</h4>
                <p>
                  A saved search that matches a new listing notifies you
                  wherever you are.
                </p>
              </div>
            </div>
            <div className="mob-item">
              <div className="mob-ico">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 15a3 3 0 0 1-3 3H8l-4 3V6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3Z" />
                </svg>
              </div>
              <div>
                <h4>Answer an offer from anywhere</h4>
                <p>
                  Counters and acceptances are time-sensitive. Handle them from
                  the queue at the bank.
                </p>
              </div>
            </div>
          </div>
          <span className="mob-note">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9.5" />
              <path d="M12 16v-5" />
              <path d="M12 8h.01" />
            </svg>
            Responsive web. Native apps are not in the v1 scope.
          </span>
        </div>
      </div>
    </section>
  );
}
