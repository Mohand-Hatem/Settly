import React from "react";
import Link from "next/link";

export function AssistantShowcase() {
  return (
    <section className="sect ai">
      <div className="wrap">
        <div className="ai-grid">
          <div>
            <h2>Ask for the home. Not the filter combination.</h2>
            <p className="lead">
              Settly&apos;s assistant reads a sentence the way a good broker would,
              then searches the same verified index the filters use, then shows
              you which part of your request each result answered.
            </p>
            <Link className="btn btn-accent" href="/assistant">
              Try the assistant
            </Link>
            <div className="ai-note">
              <svg
                width="16"
                height="16"
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
              <span>
                The assistant reads listings and public knowledge only. It
                never sees your messages, offers or payments, and it never acts
                on your behalf: anything that changes your account comes back to
                you to confirm.
              </span>
            </div>
          </div>

          <div className="chat">
            <div className="chat-head">
              <span className="dot"></span> Settly assistant
            </div>
            <div className="bubble bubble-you">
              4-bedroom villa with a private pool in New Cairo, ready this year,
              under 35M.
            </div>
            <div className="bubble bubble-ai">
              Three listings match all four conditions. Two more match
              everything except handover; those deliver in Q2 next year.
            </div>
            <div className="ai-results">
              <div className="ai-res">
                <img
                  src="/images/11.jpg"
                  alt="Lake View Signature Villa"
                  loading="lazy"
                />
                <div>
                  <b>Lake View Signature Villa</b>
                  <span>Golden Square · 540 m² · 32.5M</span>
                </div>
                <span className="pct">4 / 4</span>
              </div>
              <div className="ai-res">
                <img
                  src="/images/9.jpg"
                  alt="Courtyard Townhouse"
                  loading="lazy"
                />
                <div>
                  <b>Courtyard Townhouse</b>
                  <span>Villette · 285 m² · 21.4M</span>
                </div>
                <span className="pct">4 / 4</span>
              </div>
              <div className="ai-res">
                <img
                  src="/images/4.jpg"
                  alt="Palm Court Residence"
                  loading="lazy"
                />
                <div>
                  <b>Palm Court Residence</b>
                  <span>Mivida · 470 m² · 29.8M</span>
                </div>
                <span className="pct">3 / 4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
