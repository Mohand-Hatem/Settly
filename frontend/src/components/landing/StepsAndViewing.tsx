"use client";

import React, { useState } from "react";
import Link from "next/link";

export function StepsSection() {
  return (
    <section className="sect steps-sect" id="how">
      <div className="wrap">
        <div className="shead" style={{ textAlign: "center", marginInline: "auto" }}>
          <h2>From first search to keys in hand.</h2>
          <p>
            The whole purchase runs in one place, and every step leaves a record
            you can go back to.
          </p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-ico">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.6-3.6" />
              </svg>
            </div>
            <h3>Discover</h3>
            <p>Search, filter, compare side by side, and save what you like.</p>
          </div>
          <div className="step">
            <div className="step-ico">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="5" width="18" height="16" rx="2.5" />
                <path d="M3 10h18M8 3v4M16 3v4" />
                <path d="m9.5 15 1.8 1.8 3.2-3.4" />
              </svg>
            </div>
            <h3>Request a viewing</h3>
            <p>Propose a time with the agent and confirm it in the thread.</p>
          </div>
          <div className="step">
            <div className="step-ico">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7.5 12 4l8 3.5" />
                <path d="M4 7.5v9L12 20l8-3.5v-9" />
                <path d="M8.5 13.5h7" />
              </svg>
            </div>
            <h3>Make an offer</h3>
            <p>
              Submit a figure, counter, and track every round of the
              negotiation.
            </p>
          </div>
          <div className="step">
            <div className="step-ico">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="6" width="18" height="13" rx="2.5" />
                <path d="M3 10.5h18" />
                <circle cx="16.5" cy="15" r="1.4" />
              </svg>
            </div>
            <h3>Reserve</h3>
            <p>
              Pay the reservation deposit on the accepted offer and get a
              receipt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ViewingScheduler() {
  const [selectedDay, setSelectedDay] = useState<number>(12);
  const [selectedSlot, setSelectedSlot] = useState<string>("14:00");
  const [requested, setRequested] = useState<boolean>(false);

  const daysData = [
    { day: 23, off: true },
    { day: 24, off: true },
    { day: 25, off: true },
    { day: 26, off: true },
    { day: 27, off: true },
    { day: 28, off: true },
    { day: 1, off: false },
    { day: 2, off: false },
    { day: 3, off: false, has: true },
    { day: 4, off: false },
    { day: 5, off: false, has: true },
    { day: 6, off: false },
    { day: 7, off: false, has: true },
    { day: 8, off: false },
    { day: 9, off: false },
    { day: 10, off: false, has: true },
    { day: 11, off: false },
    { day: 12, off: false, has: true },
    { day: 13, off: false, has: true },
    { day: 14, off: false },
    { day: 15, off: false },
    { day: 16, off: false, has: true },
    { day: 17, off: false },
    { day: 18, off: false },
    { day: 19, off: false, has: true },
    { day: 20, off: false },
    { day: 21, off: false, has: true },
    { day: 22, off: false },
    { day: 23, off: false },
    { day: 24, off: false, has: true },
    { day: 25, off: false },
    { day: 26, off: false },
    { day: 27, off: false, has: true },
    { day: 28, off: false },
  ];

  const getDayOfWeek = (d: number) => {
    const dow = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const date = new Date(2026, 2, d);
    return dow[date.getDay()];
  };

  return (
    <section className="sect viewing">
      <div className="wrap viewing-grid">
        <div>
          <h2 style={{ fontSize: "clamp(1.85rem, 3.2vw, 2.6rem)" }}>
            Book the viewing without the phone tag.
          </h2>
          <p
            style={{
              fontSize: "1.06rem",
              color: "var(--ink-2)",
              lineHeight: 1.68,
              marginBlock: "1rem 1.8rem",
              maxWidth: "48ch",
            }}
          >
            Pick a slot from the agent&apos;s real availability and send the
            request. They accept, propose another time, or decline, and the whole
            exchange stays attached to the listing so nobody is reconstructing it
            from memory a week later.
          </p>
          <div className="checks" style={{ marginBlock: "0 2rem" }}>
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
                <h4>Availability comes from the agent</h4>
                <p>
                  Slots shown are the ones they published. You are not
                  requesting into a void.
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
                <h4>Reschedule and cancel are first-class</h4>
                <p>
                  Both sides can move a confirmed viewing, and both sides get
                  told.
                </p>
              </div>
            </div>
          </div>
          <Link className="btn btn-primary" href="/search">
            Request a viewing
          </Link>
        </div>

        <div className="cal">
          <div className="cal-top">
            <b>March 2026</b>
            <div className="cal-nav">
              <button type="button" aria-label="Previous month">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <button type="button" aria-label="Next month">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="cal-grid">
            <div className="cal-dow">Mo</div>
            <div className="cal-dow">Tu</div>
            <div className="cal-dow">We</div>
            <div className="cal-dow">Th</div>
            <div className="cal-dow">Fr</div>
            <div className="cal-dow">Sa</div>
            <div className="cal-dow">Su</div>
            {daysData.map((item, idx) => {
              if (item.off) {
                return (
                  <span key={idx} className="cal-d off">
                    {item.day}
                  </span>
                );
              }
              const isSelected = selectedDay === item.day;
              return (
                <button
                  key={idx}
                  className={`cal-d ${item.has ? "has" : ""} ${isSelected ? "sel" : ""}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedDay(item.day)}
                >
                  {item.day}
                </button>
              );
            })}
          </div>
          <hr className="cal-sep" />
          <p className="cal-lab">
            {getDayOfWeek(selectedDay)} {selectedDay} March · available slots
          </p>
          <div className="slots">
            <button
              className={`slot ${selectedSlot === "10:00" ? "on" : ""}`}
              type="button"
              aria-pressed={selectedSlot === "10:00"}
              onClick={() => setSelectedSlot("10:00")}
            >
              10:00
            </button>
            <button className="slot" type="button" disabled>
              11:30
            </button>
            <button
              className={`slot ${selectedSlot === "14:00" ? "on" : ""}`}
              type="button"
              aria-pressed={selectedSlot === "14:00"}
              onClick={() => setSelectedSlot("14:00")}
            >
              14:00
            </button>
            <button
              className={`slot ${selectedSlot === "16:30" ? "on" : ""}`}
              type="button"
              aria-pressed={selectedSlot === "16:30"}
              onClick={() => setSelectedSlot("16:30")}
            >
              16:30
            </button>
          </div>
          <button
            className="btn btn-accent"
            type="button"
            style={{ width: "100%", cursor: "pointer" }}
            onClick={() => {
              setRequested(true);
              setTimeout(() => setRequested(false), 3000);
            }}
          >
            {requested ? "Viewing Requested ✓" : "Request this slot"}
          </button>
          <p className="cal-agent">
            <span className="av">HK</span>
            Hosted by{" "}
            <b style={{ color: "var(--ink)", fontWeight: 600 }}>Hana K.</b>,
            verified agent · usually replies within an hour
          </p>
        </div>
      </div>
    </section>
  );
}

export function StepsAndViewing() {
  return (
    <>
      <StepsSection />
      <ViewingScheduler />
    </>
  );
}
