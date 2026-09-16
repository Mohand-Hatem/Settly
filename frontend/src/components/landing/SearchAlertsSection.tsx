"use client";

import React, { useState } from "react";

export function SearchAlertsSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3500);
      setEmail("");
    }
  };

  return (
    <section className="sect alerts">
      <div className="wrap alerts-grid">
        <div>
          <h2>Let the next one find you.</h2>
          <p>
            Save a search and Settly tells you when a listing matching it goes
            live, before it reaches the general feed.
          </p>
        </div>
        <div>
          <form className="alert-form" onSubmit={handleSubmit}>
            <label
              htmlFor="em"
              className="visually-hidden"
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                overflow: "hidden",
                clip: "rect(0 0 0 0)",
              }}
            >
              Email address
            </label>
            <input
              id="em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <button className="btn btn-primary" type="submit">
              {submitted ? "Alert Created!" : "Create alert"}
            </button>
          </form>
          <p className="alert-fine">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="4" y="10" width="16" height="10" rx="2.5" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Match alerts only. Unsubscribe in one click.
          </p>
        </div>
      </div>
    </section>
  );
}
