import React from "react";
import Image from "next/image";
import Link from "next/link";
import { SearchConsole } from "./SearchConsole";

export function HeroSection() {
  return (
    <section className="hero" id="top">
      <div className="hero-bg">
        <Image
          src="/images/hero.jpg"
          alt="A contemporary Egyptian villa at dusk, glazed façade lit from within, reflecting pool in the foreground."
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover", objectPosition: "62% 58%" }}
        />
      </div>
      <div className="wrap hero-in">
        <div className="hero-copy">
          <div className="hero-badges rise d1">
            <span className="hbadge">
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
                <path d="M12 2 4 6v6c0 5 3.4 8.9 8 10 4.6-1.1 8-5 8-10V6z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              Verified listings
            </span>
            <span className="hbadge">
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
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              Map &amp; semantic search
            </span>
            <span className="hbadge">
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Verified title &amp; due diligence
            </span>
          </div>

          <h1 className="rise d2">
            Find your next home in Egypt, <em>faster</em> and with complete
            clarity.
          </h1>
          <p className="hero-sub rise d2">
            Villas, penthouses and duplexes across New Cairo, Sheikh Zayed and
            the North Coast. Each one carries verified area, price per square
            metre and handover terms, so you compare the numbers instead of the
            marketing.
          </p>

          <SearchConsole />

          <div className="trending rise d4">
            <span>Popular:</span>
            <Link href="/search?location=new-cairo">New Cairo villas</Link>
            <Link href="/search?location=north-coast">Sahel chalets</Link>
            <Link href="/search?type=DUPLEX&location=sheikh-zayed">Zayed duplexes</Link>
            <Link href="/search?ready=true">Ready to move</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
