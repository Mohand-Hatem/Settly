import React from "react";

export function CapabilityStrip() {
  return (
    <section className="cap">
      <div className="wrap">
        <div className="cap-grid">
          <div className="cap-item">
            <div className="cap-ico">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3>Verified listings</h3>
              <p>
                Agents are identity-verified and every listing is moderated
                before it goes live.
              </p>
            </div>
          </div>
          <div className="cap-item">
            <div className="cap-ico">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 4-6 2.5v13L9 17l6 3 6-2.5v-13L15 7z" />
                <path d="M9 4v13M15 7v13" />
              </svg>
            </div>
            <div>
              <h3>Map &amp; semantic search</h3>
              <p>
                Filter on a live map, or just describe the home you want in your
                own words.
              </p>
            </div>
          </div>
          <div className="cap-item">
            <div className="cap-ico">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
                <path d="M2.5 10h19" />
                <path d="M7 15h4" />
              </svg>
            </div>
            <div>
              <h3>Secure reservation</h3>
              <p>
                Reserve an accepted offer with a deposit paid inside the
                platform, receipted.
              </p>
            </div>
          </div>
          <div className="cap-item">
            <div className="cap-ico">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9.5" />
                <path d="M2.5 12h19" />
                <path d="M12 2.5a15 15 0 0 1 0 19a15 15 0 0 1 0-19" />
              </svg>
            </div>
            <div>
              <h3>Built bilingual</h3>
              <p>
                English and Arabic are equal citizens, with full right-to-left
                and no auto-translation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
