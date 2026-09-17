# Payments

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #11, #13, #33, #42
    Related:      CONCURRENCY_AND_IDEMPOTENCY.md, ../product/BUSINESS_RULES.md Sections 5-7

## 1. Purpose

The complete Paymob payment lifecycle: models, verification, reconciliation, refunds, and the
non-authoritative browser return.

## 2. Provider and checkout model

**Paymob**, hosted redirect checkout only. **Settly never accepts, transmits, logs, or stores
card data** — not in the database, not in logs, not in an error report. v1 accepts **synchronous
methods only** (card, wallet, instalments) — cash/kiosk and manual bank transfer are deferred to
v2 because they cannot complete inside the 15-minute checkout hold.

**Deposit amount: 5% of property price, capped at 50,000 EGP** — credited toward the sale price (#76).

**Agent subscription payments (#89–#92).** Pro (**$20/month**) and Enterprise (**$50/month**) —
**base prices in USD**; Free is $0 — are paid through **Paymob hosted checkout** — no saved card, no
automatic renewal. **Every paid period lasts 30 full days from its start time at the full price, with
no proration (#104):** the first subscription, re-subscription after a lapse, a mid-period upgrade
(which starts a new 30-day period immediately, with no credit for the old plan) and each renewal.
Subscription periods are independent of the calendar-month listing quota. A period is exactly 720
hours (`startsAt + 30 days`, UTC). An **early renewal** is allowed only in the last 7 days, **starts
when the current period ends**, is limited to one queued period, and blocks upgrades until it starts
(#104 amendment). Failed or missing renewal → Free on the expiry date. Cancellation → no refund. V1 issues a
**simple receipt**; VAT/e-invoicing is verification item **V36**.

**Currency boundary (#89, #103).** Subscription base prices are **USD**, and the plans UI shows USD
only. The **subscription payment is charged in EGP** at the **fixed V1 rate 1 USD = 48.98 EGP**
(`USD × 48.98`, rounded up to a whole EGP: Pro **980 EGP**, Enterprise **2,449 EGP**). The rate is a
business constant, not a live rate: **no exchange-rate provider, no refresh job**.

At checkout, Settly computes the EGP amount and shows it to the agent **before redirecting**. It then
creates the Paymob payment request in **EGP for exactly that amount**, stores the USD base (cents), the
EGP amount (piastres) and the rate used, and the webhook checks that amount and currency exactly. The
receipt shows the EGP charged, with the USD price and the rate as reference.

**Deposits, refunds and all real-estate amounts are EGP** and are unaffected. **Verification (portfolio/demo
scope, #46):** the exact EGP amounts are checked with a Paymob **sandbox** test during implementation
(**V37**). Written Paymob confirmation and the legal, VAT and e-invoicing review (**V36**) are required
**only before a real launch**. Nothing is implemented yet.

**Transaction revenue (#79) — TBD.** How it is charged and paid out is not decided; nothing in this
document applies to it until a decision says so. V34 covers the legality of Settly handling these
funds.

## 3. Models

| Model | Role |
|---|---|
| `Payment` | The obligation — amount, currency, deadline, **gross/providerFee/net** |
| `PaymentAttempt` | One try at the provider — failure belongs here, never to `Payment` |
| `Refund` | Full/partial + `feeReturned` (a "100% refund" still costs the processing fee) |
| `WebhookEvent` | Raw inbound events, unique on `(provider, eventId)`. **Payload purged after 90d; id kept forever** (#42) |
| `IdempotencyKey` | Client-supplied keys, Postgres-only |
| `AgentSubscription` (#105) | One row per agent; anchors the subscription; `cancelledAt` |
| `SubscriptionPeriod` (#105) | One paid 30-day period: plan, kind, `startsAt`/`endsAt` (UTC), `endedEarlyAt`, status `SCHEDULED`/`ACTIVE`/`ENDED`/`SUPERSEDED` |
| `SubscriptionPayment` (#105) | Subscription obligation: USD base (cents) + fixed-rate snapshot + **EGP charged (piastres)** + fee/net; 60-minute checkout; `receiptNumber`. **Separate from the deposit `Payment`** |
| `SubscriptionPaymentAttempt` (#105) | One try at Paymob for a subscription payment |

`WebhookEvent`, `IdempotencyKey`, the provider port and reconciliation are **shared** by deposits and
subscriptions. The Paymob merchant order reference is prefixed (`dep_` / `sub_`) so step 4 of the
webhook maps an event to the right record.

## 4. Provider port — one adapter, justified by testability

Four methods: `createCheckout`, `getTransaction`, `reverse`, `verifyWebhook`. **One Paymob
adapter in production; a fake adapter + local webhook signer for all local/CI testing** — this
makes the entire state machine, every race, and the checkout hold testable without a network call
(see `../process/TESTING.md`).

## 5. Payment state machine (condensed — full in BUSINESS_RULES.md Section 5)

```
  PENDING ──attempt started──► PROCESSING ──verified webhook──► SUCCEEDED
     ▲ │                          │                              │     │
     └─┴── attempt fails ─────────┘                         full │     │ partial
       ├── offer withdrawn/superseded ─► CANCELLED                ▼     ▼
       └── 72h deadline passes ────────► EXPIRED             REFUNDED  PARTIALLY_REFUNDED
```

**Two absolute rules:**
1. **No client-originated transition may ever produce SUCCEEDED.** The browser return URL updates
   nothing — it only triggers UI polling against our own status endpoint.
2. **Every `PROCESSING` payment past a threshold is reconciled** by polling the provider.
   Webhooks are a latency optimization; reconciliation is the correctness guarantee.

## 6. Webhook verification — strict order

```
  1. Read raw body (route mounted BEFORE the JSON parser; no session middleware on this route)
  2. Verify HMAC over Paymob's ordered field concatenation (NOT the raw body) ── fail → 401, alert
  3. Parse
  4. Map to a known Payment or SubscriptionPayment (by the `dep_` / `sub_` reference prefix, #105)
  5. ASSERT amount AND currency match EXACTLY ── mismatch → flag for manual review (fraud signal)
  6. Insert WebhookEvent, unique (provider, eventId) ── duplicate → 200 immediately, no work
  7. Interpret provider flag COMBINATIONS (never `success` alone)
  8. Apply the atomic bundle (Section 7)
  9. Return 200; 5xx ONLY on genuine failure, so Paymob retries
```

⚠️ Paymob's HMAC field ordering and exact flag semantics are **PENDING VERIFICATION — V4**,
required before implementation, confirmed via a mandatory sandbox test (not invented from memory).

## 7. The atomic bundle (T1, see CONCURRENCY_AND_IDEMPOTENCY.md)

On a verified deposit webhook, one transaction: `WebhookEvent` recorded → `Payment`/
`PaymentAttempt` → `SUCCEEDED` → `Offer` → `RESERVED` (the commitment point) → `Property` →
`RESERVED` → rival offers → `SUPERSEDED` → rival payments → `CANCELLED` → (no lead `WON` here; it is
set when the sale completes, #83) →
`AuditLog` → notifications **enqueued** (never sent inside the transaction).

## 8. The checkout hold and the residual race

A 15-minute exclusive hold (Section 5, CONCURRENCY doc) moves the deposit race to before money
moves. If a hold expires mid-payment and two deposits still race: the loser's payment is marked
`SUCCEEDED` (it did succeed), the offer `SUPERSEDED`, and a **full automatic refund** issued
immediately with a clear notification. Settly absorbs the provider fee on both legs — the
quantified argument for the hold's existence.

## 9. Refunds

One `reverse(attempt, amount)` operation choosing **void** (pre-settlement, same-day, usually no
fee) or **refund** (post-settlement, fee generally not returned) by settlement window. Recoverable
3-step pattern: record intent (`REQUESTED`) → call provider → record result — a durable state
between steps means a crash mid-call is resolvable by a sweeper.

**Refunds are system/admin-initiated per business-rule policy, never buyer self-service** (#33).
See `BUSINESS_RULES.md` Section 7 for the retention/cooling-off percentages.

## 10. Failure matrix

| Failure | Behaviour |
|---|---|
| Checkout create times out | "Try again"; attempt stays `INITIATED`; retry reuses the idempotency key |
| Webhook delayed | UI polls, shows "confirming"; reconciliation resolves within its window |
| Transaction fails after capture | Return 5xx → Paymob retries → T1 reapplies. Money never lost, only delayed |
| Refund provider call fails | `Refund.FAILED` → retry, then admin alert. Money never silently disappears |
| Paymob outage | New checkouts fail cleanly; existing payment state is untouched; reconciliation resumes on recovery |

## 11. Five invariants

The frontend can never mark a payment successful · a webhook may arrive any number of times in
any order with the same outcome · if webhooks stop entirely, reconciliation still settles every
payment · captured money is always applied or refunded, never neither · every transition is
audited.

## 12. Pending verification

**V4** — Paymob HMAC field ordering and current flag semantics, confirmed via sandbox test before
payment work is considered complete. Not invented.

## 13. Rejected / do not add

Stripe (cannot onboard Egyptian entities) · embedded card fields (PCI scope) · cash/kiosk in v1 ·
allow-the-race-without-a-hold · buyer-initiated refunds · IP-allowlisting Paymob as a security
control · rejecting old webhook retries by age.

## 14. Related documents

`CONCURRENCY_AND_IDEMPOTENCY.md` for the transaction and race mechanics ·
`../product/BUSINESS_RULES.md` Sections 5-7 for the full state machine and refund policy.
