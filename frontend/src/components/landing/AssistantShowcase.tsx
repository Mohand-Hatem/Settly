import React from "react";
import Image from "next/image";

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
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs font-semibold bg-navy-800 text-brass border border-brass/30">
              Interactive Assistant · Arriving in Phase 3
            </span>
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
                <Image
                  src="/images/11.jpg"
                  alt="Lake View Signature Villa"
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                />
                <div>
                  <b>Lake View Signature Villa</b>
                  <span>Golden Square · 540 m² · 32.5M</span>
                </div>
                <span className="pct">4 / 4</span>
              </div>
              <div className="ai-res">
                <Image
                  src="/images/9.jpg"
                  alt="Courtyard Townhouse"
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
                />
                <div>
                  <b>Courtyard Townhouse</b>
                  <span>Villette · 285 m² · 21.4M</span>
                </div>
                <span className="pct">4 / 4</span>
              </div>
              <div className="ai-res">
                <Image
                  src="/images/4.jpg"
                  alt="Palm Court Residence"
                  width={48}
                  height={48}
                  className="rounded-md object-cover"
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
