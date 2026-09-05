# Settly Business Rules

    Status:       LOCKED
    Last Updated: 2026-09-05
    Decisions:    #1, #2, #5, #11, #13, #27, #28, #31, #33, #35, #38, #39, #40, #42
    Related:      ../GLOSSARY.md, ../DECISIONS.md,
                  architecture/CONCURRENCY_AND_IDEMPOTENCY.md (Tier B),
                  architecture/PAYMENTS.md (Tier B)

The authoritative domain invariants and state machines.

> **An implementation must not change any rule in this document without an explicit
> architectural or business decision recorded in `../DECISIONS.md`.**

> **Every transition below maps to exactly one API action endpoint** (Decision #40) —
> `POST /offers/:id/accept`, `POST /properties/:id/publish`, and so on. State is **never** mutated
> through `PATCH /resource/:id { status }`. Each action carries the guard, authorization, side
> effects, idempotency and concurrency behaviour recorded here, so **the endpoint list and these
> transition tables are meant to be read side by side.**

---

## 1. Business constants

**Status: values LOCKED. Storage mechanism PENDING — see Decision #31.**

Per Decision #31, these values will have **one authoritative definition in a backend
configuration module**, and this table will be **generated from it** once that module exists.
Until then the table is hand-maintained and these values are authoritative.

| Constant | Value | Governs |
|---|---|---|
| Deposit amount | **5% of property price, capped at 50,000 EGP** | Payment obligation created on offer acceptance |
| Deposit deadline | **72 hours** | `ACCEPTED` offer expires unpaid |
| Offer TTL | **7 days** | A pending offer expires with no response |
| Checkout hold | **15 minutes** | Exclusive right to *attempt* payment |
| Cooling-off window | **48 hours** | Full refund on buyer withdrawal after reservation |
| Post-cooling-off retention | **20%** | Platform/agent retains this share on late buyer withdrawal |
| Viewing grace period | **30 minutes** | After `starts_at`, before a no-show may be recorded |
| Max open viewing requests per buyer | **3** | Concurrent `REQUESTED` + `RESCHEDULE_PROPOSED` (I9) |
| **Max saved searches per user** | **25** | Bounds durable background matching work (I11) |
| **Max live offers per buyer** | **5** | Across all properties; see §4.1 for the state definition (I12) |
| Currency | **EGP**, stored as `BIGINT` piastres | All monetary values |

**The prose in this document is hand-written and stays hand-written**, because it explains what a
generated table cannot: why each rule exists, what happens when it triggers, who is affected, what
transitions follow, and what notifications result. **The generated table must never be the only
documentation of a rule.**

### Not in this document

**AI and technical operational limits are deliberately separate** (Decision #31) and belong in the
architecture documents, not here: agent step and time caps, token and cost budgets, tool-iteration
limits, chunk sizes, embedding dimensions, RRF parameters, ranking boost caps, cache TTLs and
retrieval thresholds. Do not merge them into the table above.

---

## 2. Property lifecycle

**8 states.** `DRAFT` · `PENDING_REVIEW` · `REJECTED` · `PUBLISHED` · `RESERVED` · `SOLD` ·
`ARCHIVED` · `SUSPENDED`

```
   ∅ ──► DRAFT ──submit──► PENDING_REVIEW ──approve──► PUBLISHED ──► SUSPENDED
          ▲ ▲                   │                       │  │  ▲         │
          │ │                 reject                    │  │  └─ admin ─┘
          │ └──────── REJECTED ◄┘                       │  │             │
          │              │ resubmit                     │  │          archive
       relist            └──────────────────────────────┘  │             ▼
          │                                deposit confirmed│        ARCHIVED
          │                                                 ▼             │
          │                                            RESERVED           │
          │                                             │    │            │
          │                            agent confirms ──┘    └─ falls ────┤
          │                                    ▼             through      │
          └────────────────────────────────  SOLD  ◄── offline sale  ◄────┘
                                           (terminal)     (from PUBLISHED)
```

| # | Transition | Actor | Guard | Effects |
|---|---|---|---|---|
| P1 | ∅ → `DRAFT` | Agent | Account active | Audit |
| P2 | `DRAFT` → `PENDING_REVIEW` | Agent | Required fields complete; ≥3 images; **agent verified**; area resolves to a valid `Area` node | Enters moderation queue; notify admins |
| P3 | `PENDING_REVIEW` → `PUBLISHED` | Admin | — | `published_at` set; enqueue embedding; enqueue saved-search matching; notify agent; audit |
| P4 | `PENDING_REVIEW` → `REJECTED` | Admin | **Reason required** | Notify agent with reason; audit |
| P5 | `REJECTED` → `PENDING_REVIEW` | Agent | As P2 | Re-queue |
| P6 | `PUBLISHED` → `PUBLISHED` (edit) | Agent | See §2.1 | Price change writes `PropertyPriceHistory` and triggers price-drop alerts; description change triggers re-embedding |
| P7 | `PUBLISHED` → `ARCHIVED` | Agent | **No `RESERVED` offer outstanding** | Remove from index; notify open leads; audit |
| P8 | `PUBLISHED` → `RESERVED` | **System** | Deposit `SUCCEEDED` on an accepted offer | Atomic — see §6 |
| P9 | `RESERVED` → `SOLD` | Agent | — | Final price recorded for insights; leads closed; audit |
| P10 | `RESERVED` → `PUBLISHED` | Agent or Admin | **Reason required** | Offer → `FELL_THROUGH`; **refund evaluation**; relisted; audit |
| P11 | `PUBLISHED` → `SOLD` | Agent | **Reason required** | **Offline-sale escape hatch.** Rival offers superseded; pending deposits cancelled and refunded; audit-flagged |
| P12 | `PUBLISHED`/`RESERVED` → `SUSPENDED` | Admin | **Reason required** | Hidden immediately; **if `RESERVED`, deposit refunded in full**; agent and affected buyers notified |
| P13 | `SUSPENDED` → `PUBLISHED`/`ARCHIVED` | Admin | — | Audit |
| P14 | `ARCHIVED` → `DRAFT` | Agent | — | Relist; must pass review again |

**Forbidden:** `DRAFT` → `PUBLISHED` (review is never skipped) · any transition out of `SOLD`
(hard terminal) · any agent-driven write while `SUSPENDED`.

### 2.1 Two-tier edit moderation

| Field class | Fields | Effect of editing a published listing |
|---|---|---|
| **Structural** | address/geo, property type, area, images, title, listing intent | → `PENDING_REVIEW`, **temporarily hidden** |
| **Content** | price, description, amenities, availability | **Stays live**, raises a non-blocking recheck flag for admin review |

Rationale: the abuse vector is bait-and-switch — approve a clean listing, then swap the content —
so blocking review applies only to fields that enable a swap. Price edits stay instant because
stale prices are the most-complained-about defect on every property portal.

### 2.2 Deletion (Decision #42)

> **A Property may be hard-deleted only if it has never left `DRAFT`. Any property that has ever
> been published must remain `ARCHIVED` or `SUSPENDED` rather than being deleted.**

**Why.** A published listing accumulates business history — leads, viewings, offers, and possibly a
completed payment — and `SOLD` records feed market insights. Deleting it would orphan or falsify
records other parties legitimately rely on.

| State | Removal |
|---|---|
| `DRAFT`, never published | **Hard delete permitted.** Media deleted with it |
| `PENDING_REVIEW` | Withdraw to `DRAFT` first |
| `PUBLISHED`, `RESERVED` | `ARCHIVED` (agent) or `SUSPENDED` (admin) — **discoverability removed, history preserved** |
| `SOLD` | **Permanent.** Terminal, and market insights depend on it |
| `ARCHIVED` | Retains media, because `ARCHIVED → DRAFT` relisting (P14) is a supported path |

**Removing discoverability is not deletion.** An archived or suspended listing leaves search, the
sitemap and the public API, but its offers, viewings, payments and audit trail remain intact.

---

## 3. Viewing lifecycle

**8 states.** `REQUESTED` · `RESCHEDULE_PROPOSED` · `CONFIRMED` · `DECLINED` · `CANCELLED` ·
`COMPLETED` · `NO_SHOW` · `EXPIRED`

```
  REQUESTED ──agent confirms──► CONFIRMED ──► COMPLETED (terminal)
     │  │                        │   │    └─► NO_SHOW   (terminal)
     │  │                        │   └── either party cancels ──► CANCELLED
     │  └─ agent proposes new time ─► RESCHEDULE_PROPOSED
     │                                    │           │
     │                          buyer accepts    buyer declines
     │                                    ▼           ▼
     │                                CONFIRMED   CANCELLED
     ├── agent declines ──► DECLINED (terminal)
     └── time passes, no response ──► EXPIRED (terminal, system)
```

| # | Transition | Actor | Guard | Effects |
|---|---|---|---|---|
| V1 | ∅ → `REQUESTED` | Buyer *(or the AI tool on the buyer's behalf)* | **Buyer `emailVerified = true`**; property `PUBLISHED`; time inside `AgentAvailability`; in the future; **buyer has fewer than 3 open requests (I9)** | `Lead` created or reused; notify agent |
| V2 | `REQUESTED` → `CONFIRMED` | Agent | **No other `CONFIRMED` viewing for this agent overlapping this time range** | **Auto-decline rival `REQUESTED` rows for the same slot**; notify buyer; calendar invite |
| V3 | `REQUESTED` → `DECLINED` | Agent | Optional reason | Notify buyer with alternative slots |
| V4 | `REQUESTED` → `RESCHEDULE_PROPOSED` | Agent | Proposed time inside availability | Notify buyer |
| V5 | `RESCHEDULE_PROPOSED` → `CONFIRMED` | Buyer | As V2 | As V2 |
| V6 | `RESCHEDULE_PROPOSED` → `CANCELLED` | Buyer | — | Notify agent |
| V7 | `CONFIRMED` → `CANCELLED` | Buyer or Agent | Record `cancelled_by` + reason | Slot released; notify other party; if under 2 hours before, flag the canceller's reliability counter |
| V8 | `CONFIRMED` → `COMPLETED` | Agent | Only after `starts_at` | `Lead` advances; buyer prompted to make an offer |
| V9 | `CONFIRMED` → `NO_SHOW` | Agent | Only after `starts_at` **+ 30 minutes grace** | Buyer reliability counter; notify buyer |
| V10 | `REQUESTED`/`RESCHEDULE_PROPOSED` → `EXPIRED` | **System** | Requested time passed with no response | Notify both; counts against agent responsiveness |
| V11 | any non-terminal → `CANCELLED` | **System** | Property left `PUBLISHED`/`RESERVED` | Notify buyer with reason |

### 3.1 Overlap rule

**Exclusivity attaches at `CONFIRMED`, never at `REQUESTED`.** Many buyers may request the same
slot; only one confirmation survives.

**Viewings have duration.** A confirmed 14:00–15:00 viewing must block a 14:30 request, so the
constraint is over a **time range**, not a start instant.

### 3.2 Time and DST

Egypt observes DST (Africa/Cairo). `AgentAvailability` is authored in **local wall-clock** and
resolved to UTC instants per date. Viewings store UTC instants plus the booking zone.
**All scheduling arithmetic happens server-side.**

---

## 4. Offer lifecycle

**10 states.** `PENDING_AGENT` · `PENDING_BUYER` · `ACCEPTED` · `RESERVED` · `REJECTED` ·
`WITHDRAWN` · `EXPIRED` · `SUPERSEDED` · `COMPLETED` · `FELL_THROUGH`

```
                 ┌──── agent counters ────┐
                 ▼                        │
  ∅ ─► PENDING_AGENT ──────────────► PENDING_BUYER
        │  │  │     buyer counters ◄──────┘  │  │
        │  │  └── agent accepts ──┐  ┌── buyer accepts ┘  │
        │  │                      ▼  ▼                    │
        │  │                   ACCEPTED ◄─────────────────┘
        │  │                    │  │  └─ deadline (72h) ─► EXPIRED
        │  │   deposit confirmed│  └──── buyer withdraws ─► WITHDRAWN
        │  │                    ▼
        │  │                RESERVED  ◄── the commitment point
        │  │                 │     │
        │  │   agent confirms│     │ deal collapses
        │  │                 ▼     ▼
        │  │            COMPLETED  FELL_THROUGH ──► refund evaluation
        │  └── agent rejects ──► REJECTED
        └───── buyer withdraws ─► WITHDRAWN

  Any non-terminal ──► SUPERSEDED  (a rival reached RESERVED, or offline sale)
```

| # | Transition | Actor | Guard | Effects |
|---|---|---|---|---|
| O1 | ∅ → `PENDING_AGENT` | Buyer | **Buyer `emailVerified = true`**; property `PUBLISHED` **and not `RESERVED`**; **listing intent = SALE**; buyer has no live offer on this property; **buyer has fewer than 5 live offers overall (I12)** | `OfferRevision` #1; `Lead` advances; notify agent |
| O1b | ∅ → `PENDING_BUYER` | **Agent** | — | **Offline escape hatch:** agent records terms agreed off-platform; buyer must confirm. Audit-flagged as agent-initiated |
| O2 | `PENDING_AGENT` → `PENDING_BUYER` | Agent | Terms differ | New `OfferRevision`; notify buyer |
| O3 | `PENDING_BUYER` → `PENDING_AGENT` | Buyer | **Buyer `emailVerified = true`**; terms differ | New `OfferRevision`; notify agent |
| O4 | `PENDING_AGENT` → `ACCEPTED` | Agent | Property still `PUBLISHED` | **Creates `Payment` (`PENDING`) with a 72-hour deadline** — atomic. **Does NOT lock the property. Does NOT supersede rivals** |
| O5 | `PENDING_BUYER` → `ACCEPTED` | Buyer | **Buyer `emailVerified = true`**; as O4 | As O4 |
| O6 | `PENDING_AGENT` → `REJECTED` | Agent | Optional reason | Notify buyer |
| O7 | any pending → `WITHDRAWN` | Buyer | — | Notify agent |
| O8 | `ACCEPTED` → `WITHDRAWN` | Buyer | Deposit not yet `SUCCEEDED` | Payment → `CANCELLED`; notify agent |
| O9 | `ACCEPTED` → `EXPIRED` | **System** | 72-hour deadline passed unpaid | Payment → `EXPIRED`; notify both; **property stays open** |
| O10 | pending → `EXPIRED` | **System** | 7-day TTL with no response | Notify both |
| O11 | `ACCEPTED` → `RESERVED` | **System** | **Verified deposit webhook `SUCCEEDED`** | The atomic bundle — §6 |
| O12 | any non-terminal → `SUPERSEDED` | **System** | Rival reached `RESERVED`, or property sold offline | Pending payment → `CANCELLED`; any succeeded deposit → **full refund**; notify buyer |
| O13 | `RESERVED` → `COMPLETED` | Agent | — | Property → `SOLD`; deposit retained per policy; audit |
| O14 | `RESERVED` → `FELL_THROUGH` | Agent or Admin | **Reason and fault attribution required** | **Refund evaluation (§7)**; property → `PUBLISHED`; audit |

**Forbidden:** offers on rent listings · a second live offer from the same buyer on the same
property · `ACCEPTED` → `RESERVED` by anything other than a verified webhook · any transition on a
`SUPERSEDED` offer · **any buyer transition that advances an obligation while
`emailVerified = false` (see §9.1)**.

### 4.1 Definition of a "live" offer

**"Live" is not a status. It is a defined subset of the ten offer states**, and both I12 and the
one-offer-per-property rule in O1 depend on it. It must never be left to interpretation.

| State | Live? | Why |
|---|---|---|
| `PENDING_AGENT` | ✅ | Open negotiation, awaiting the agent |
| `PENDING_BUYER` | ✅ | Open negotiation, awaiting the buyer |
| `ACCEPTED` | ✅ | Terms agreed; a deposit obligation is outstanding |
| `RESERVED` | ✅ | An active commitment with money captured |
| `REJECTED` | ❌ | Terminal |
| `WITHDRAWN` | ❌ | Terminal |
| `EXPIRED` | ❌ | Terminal |
| `SUPERSEDED` | ❌ | Terminal |
| `COMPLETED` | ❌ | Terminal |
| `FELL_THROUGH` | ❌ | Terminal |

> **LIVE = { `PENDING_AGENT`, `PENDING_BUYER`, `ACCEPTED`, `RESERVED` }**

**Three rules depend on this exact set:** invariant **I12** (max 5 live offers per buyer), rule **O1**
(no second live offer on the same property), and the **`PARTY` document visibility scope** (#39) —
which grants a buyer access to a property's restricted documents precisely while they hold a live
offer on it.

`RESERVED` counts as live deliberately: a buyer holding a reservation while negotiating five more
properties is precisely the over-extension I12 exists to bound. Both terminal outcomes of
`RESERVED` — `COMPLETED` and `FELL_THROUGH` — free the slot.

---

## 5. Payment lifecycle

**`Payment` — 7 states.** `PENDING` · `PROCESSING` · `SUCCEEDED` · `CANCELLED` · `EXPIRED` ·
`REFUNDED` · `PARTIALLY_REFUNDED`

```
  PENDING ──attempt started──► PROCESSING ──verified webhook──► SUCCEEDED
     ▲ │                          │                              │     │
     └─┴── attempt fails/abandons ┘                         full │     │ partial
       │   (the OBLIGATION survives)                             ▼     ▼
       ├── offer withdrawn/superseded ──► CANCELLED       REFUNDED  PARTIALLY_
       └── 72h deadline passes ─────────► EXPIRED                    REFUNDED
```

| # | Transition | Actor | Guard | Effects |
|---|---|---|---|---|
| Y1 | ∅ → `PENDING` | System | Offer reached `ACCEPTED` | Amount (5% capped at 50,000 EGP) and 72-hour deadline set, in piastres |
| Y2 | `PENDING` → `PROCESSING` | Buyer | **Buyer `emailVerified = true`**; deadline not passed; offer still `ACCEPTED`; **checkout hold acquired (§6.1)** | New `PaymentAttempt`; provider checkout created; **idempotency key required** |
| Y3 | `PROCESSING` → `PENDING` | System | Attempt failed, abandoned or provider-expired | Attempt closed; buyer may retry |
| Y4 | `PROCESSING` → `SUCCEEDED` | **System — verified webhook only** | Signature valid; event not already processed; **amount and currency match exactly** | The atomic bundle — §6 |
| Y5 | `PENDING`/`PROCESSING` → `CANCELLED` | System | Offer withdrawn/superseded, or property suspended | Live provider session voided |
| Y6 | `PENDING` → `EXPIRED` | System | Deadline passed | Offer → `EXPIRED` |
| Y7 | `SUCCEEDED` → `REFUNDED`/`PARTIALLY_REFUNDED` | System via `Refund` | Provider confirmed | Notify; audit |

**`PaymentAttempt` — 6 states:** `INITIATED → REDIRECTED → SUCCEEDED | FAILED | ABANDONED | EXPIRED`
**`Refund` — 4 states:** `REQUESTED → PROCESSING → SUCCEEDED | FAILED`
A `FAILED` refund raises an **admin alert**. Money never silently disappears.

### 5.1 Two absolute rules

1. **No client-originated transition may ever produce `SUCCEEDED`.** The browser returning from
   Paymob with a success URL updates nothing; it only causes the UI to poll. The verified webhook —
   or reconciliation — is the sole authority.
2. **Every `PROCESSING` payment older than the reconciliation window is polled against the
   provider.** The system is correct even if webhooks never arrive: **webhooks are a latency
   optimization, not a correctness dependency.**

### 5.2 Payment methods

**v1 accepts synchronous methods only** — card, mobile wallet, instalments where supported —
because asynchronous methods complete in hours and cannot fit inside the 15-minute checkout hold.

**Kiosk, cash and manual bank transfer are deferred to v2.** When added, the rule is already set:
**holds are granted only to synchronous methods**; asynchronous methods knowingly accept the race
and rely on the automatic-refund path.

---

## 6. The commitment rule and the reservation race

> **The paid, confirmed deposit is the commitment point. Offer acceptance is not.**

Acceptance does **not** lock the property and does **not** supersede rival offers. Several offers
may sit in `ACCEPTED` simultaneously and race to fund. Whoever's deposit confirms first wins.

**Product consequence, which must be surfaced honestly in the UI:** a buyer can accept, begin
paying, and lose the property mid-checkout. The interface must say so — *"this unit is not held
until your deposit clears."*

### 6.1 The checkout hold

To move contention *before* money moves rather than after, starting checkout takes a
**15-minute exclusive hold**, acquired by conditional update so only one buyer can win.

- The hold **grants no rights and reserves nothing legally.** It is permission to *attempt* payment.
- Others see *"another buyer is completing payment; you'll be notified if it falls through."*
- It expires automatically.
- It is granted **only for synchronous payment methods** (§5.2).

### 6.2 Residual race and the automatic refund

The hold does not eliminate the race — a hold can expire mid-payment. If a buyer's deposit succeeds
but a rival has already reserved the property:

1. The payment is marked `SUCCEEDED` — **it did succeed**
2. The offer is marked `SUPERSEDED`
3. A **full automatic refund** is issued immediately
4. The buyer is notified with a clear explanation

**Settly absorbs the provider fee on both legs.** This is a second, quantified reason the hold
exists: every avoided double-payment saves two legs of fees.

### 6.3 The atomic bundle

On a verified deposit webhook, **all of this commits together or none of it does:**

```
  record WebhookEvent as processed        (duplicate defence)
  Payment        PROCESSING → SUCCEEDED
  PaymentAttempt REDIRECTED → SUCCEEDED
  Offer          ACCEPTED   → RESERVED    ← commitment point
  Property       PUBLISHED  → RESERVED
  rival Offers   *          → SUPERSEDED
  rival Payments PENDING    → CANCELLED
  Lead                      → won
  AuditLog entries
  enqueue notification jobs               (ENQUEUE ONLY — never send inside the transaction)
```

**Nothing external happens inside this transaction** — no provider call, no push, no email. Those
are enqueued after commit; sweepers cover any lost enqueue.

---

## 7. Refund policy

| Cause of collapse | Refund |
|---|---|
| Agent or seller withdraws | **100%** |
| Admin suspends the listing, or an abuse report is upheld | **100%** |
| Buyer loses the reservation race (§6.2) | **100%**, automatic |
| Buyer withdraws **within 48 hours** of reservation | **100%** |
| Buyer withdraws **after 48 hours** | **Partial** — platform/agent retains **20%** |
| Collapse for external reasons (financing declined, documentation) | **Partial**, per the same retention |

**A "100% refund" still costs Settly the provider's processing fee**, which is generally not
returned. This is why gross, fee and net are modelled explicitly.

**Refunds are recoverable by construction:** record intent → call the provider → record the result,
with a durable `REQUESTED` state in between, so a process crash mid-call is resolvable by a sweeper.

---

## 8. Cross-lifecycle invariants

| # | Invariant |
|---|---|
| **I1** | At most **one** offer per property may be `RESERVED` or `COMPLETED` at a time |
| **I2** | A `RESERVED` property accepts **no** new offers and **no** new viewing requests |
| **I3** | Every `Payment` belongs to exactly one `Offer`. No orphan payments |
| **I4** | The sum of refunds against a payment never exceeds the captured amount |
| **I5** | A `SUCCEEDED` payment can exist only against an offer that was `ACCEPTED` at capture time |
| **I6** | Viewings, offers and conversations for a given (buyer, property) all reference the same `Lead` |
| **I7** | Only `PUBLISHED` and `RESERVED` properties appear in search; only `PUBLISHED` in *available* search |
| **I8** | Every state transition on property, offer, payment and refund writes an `AuditLog` row |
| **I9** | A buyer may hold at most **3** open viewing requests at once |
| **I10** | No two `CONFIRMED` viewings for the same agent may overlap in time |
| **I11** | A user may hold at most **25** saved searches |
| **I12** | A buyer may hold at most **5 live offers** across all properties — live as defined in §4.1 |

### 8.1 Enforcing the per-user count invariants

**I9, I11 and I12 are all the same shape** — *"at most N rows matching a predicate for this user"* —
and all three are vulnerable to **write skew**: two concurrent requests each count N−1, both pass,
and the user ends with N+1. No `WHERE` clause is violated, so `READ COMMITTED` cannot prevent it and
a unique constraint cannot express it.

**Mechanism: a transaction-scoped advisory lock keyed on the user id**, in a single shared namespace
covering all per-user count invariants. One lock serialises the check-and-insert for all three.

> ⚠️ **A naive count-then-insert is incorrect for I9, I11 and I12.** This is not a rate-limiting
> concern that a limiter can cover — the limiter is per-window, while these invariants are permanent.

This extends Decision #10, which originally identified two lock escalations (the viewing-request cap
and the refund-sum invariant); I11 and I12 join the first of those under the same mechanism.

---

## 9. Authorization-sensitive rules

These are business rules **and** security boundaries. They are enforced by service-layer policy
functions, never by UI or HTTP middleware.

| Rule | Enforcement |
|---|---|
| Only a **verified** agent may submit a listing for review | Guard on P2 |
| Only the **owning agent** may edit, archive or transition their own listing | Resource policy |
| Only an **admin** may approve, reject, suspend or reinstate a listing | Role + policy |
| Only the **buyer or agent party** to an offer may view or act on it | Resource policy |
| Only the **awaiting party** may act on an offer — enforced by conditional update on status | State guard |
| Only the **owning agent** may confirm, decline, complete or no-show a viewing | Resource policy |
| Only the **two participants** may read a conversation | Resource policy |
| Document access follows three scopes — **`PUBLIC`** (anyone who can view the property), **`PARTY`** (owning agent + any buyer with a **live offer**, §4.1), **`PRIVATE`** (uploader only) | **Visibility filter applied in-query**, never post-filtered. `Embedding.visibilityScope` is denormalised so the filter is a predicate on the chunk, not a join |
| **Admins download any document via a separate audited path** — admin access is a *path*, not a fourth scope, and **documents never enter an admin's RAG context** | Audited service path |
| **AI tools and the agent execute as the user**, through the same services and policies | Architectural |
| **Any AI-proposed state change requires explicit human confirmation** | Confirm-before-write |
| A **suspended** user loses access **immediately** | Opaque sessions; Better Auth cookie cache disabled |
| **An unverified email blocks obligation-advancing actions** — see §9.1 | **Business guard in the service layer**, not middleware |
| Browsing, searching, viewing, favouriting, saving searches, **withdrawing and cancelling** remain open to unverified users | No guard |

### 9.1 The verification boundary — a reusable principle

> **Email verification is required for any buyer transition that creates or advances a financial
> obligation or a scheduled commitment. It is never required to withdraw, cancel, or read.**

**This is a principle, not a list.** New transitions are evaluated against it directly; the list
below is its current application, not its definition.

| Transition | Guarded | Because |
|---|---|---|
| **V1** — request a viewing | ✅ | Creates a scheduled commitment |
| **O1** — submit an offer | ✅ | Creates an offer |
| **O3** — counter-offer | ✅ | **Advances** the negotiation; creates an `OfferRevision` |
| **O5** — accept an offer | ✅ | **Creates a `Payment` obligation and starts the 72-hour clock** |
| **Y2** — initiate the deposit payment | ✅ | Initiates payment |
| O7, O8 — withdraw an offer | ❌ | Exit must never be blocked |
| V6, V7 — cancel a viewing | ❌ | Exit must never be blocked |
| Browse · search · view · favourite · save search | ❌ | Read and discovery |

**Why exit is never guarded.** Blocking withdrawal would trap an unverified buyer inside a live
offer — consuming an I12 slot, holding an agent's attention — with no way out. A verification
requirement must never become a mechanism a user cannot escape.

**Resulting behaviour for an agent-initiated offer (O1b).** The agent may record offline-agreed
terms against a buyer regardless of that buyer's verification state — the agent is the actor and
cannot be expected to know it. The unverified buyer may then **review the offer** or **withdraw it**,
but may **not counter it, accept it, or pay the deposit** until verified. Two paths only: verify, or
withdraw.

**Why O5 in particular.** Before this guard, accepting created a `Payment` row, started the 72-hour
deposit deadline, notified the agent that a deal was progressing, and consumed a live-offer slot —
for a buyer structurally unable to reach Y2. The only downstream path was expiry. **A state machine
must not permit a transition whose sole outcome is an obligation the actor cannot fulfil.**

**This is a business rule, not security middleware.** It is enforced in the same service-layer path
as every other guard, which is why the AI tool `createViewingRequest` inherits it automatically
through V1.

---

## 10. Notification and expiry behaviour

Every system-initiated transition above is driven by a scheduled job. In-app notifications are
**authoritative and written inside the transaction**; push and email are best-effort deliveries of
them, so a Firebase outage can never mean a buyer is not told their deposit succeeded.

| Job | Drives |
|---|---|
| Payment reconciliation | Y4 when a webhook never arrives |
| Deposit expiry | O9, Y6 (72 hours) |
| Offer TTL expiry | O10 (7 days) |
| Viewing expiry | V10 |
| Checkout-hold expiry | §6.1 |
| Notification sweeper | Re-drives undelivered notifications |

---

## 11. Account lifecycle and deletion (Decision #42)

> **User deletion means anonymisation of the canonical Better Auth `user` record. It is never a row
> delete.**

**Why.** Financial, contractual and audit records must survive — a completed payment, an accepted
offer, a moderation decision. Deleting the user row would either destroy those records or orphan
them. Anonymisation removes the person while preserving the history.

| | Deleted outright | Anonymised | Retained |
|---|---|---|---|
| **Any user** | `account` (credentials), `session`, `UserDevice`, AI conversations and `AgentRun`, saved searches, collections | `user` PII overwritten **in place**; email replaced with a unique non-routable placeholder so the unique constraint still holds; `banned = true`; `anonymizedAt` set | Offers, offer revisions, viewings, payments, payment attempts, refunds, audit entries, **messages** |
| **Agent, additionally** | `AgentProfile` licence details | Same | **Property ownership and attribution** — listings display "Former agent" |

**Messages are retained with an anonymised author, deliberately.** The counterparty is a legitimate
party to that conversation; removing half of it would corrupt their record rather than protect
anyone.

**Consequences that follow automatically, with no extra enforcement:**

- An anonymised user **cannot authenticate** — credentials are deleted and `banned` is set
- Every transactional guard fails, because the verification boundary (§9.1) and `banned` both block
- `AuditLog.actorId` still resolves to a surviving row, so the evidence trail stays intact by
  construction

### 11.1 Three tiers of agent removal

Routinely conflated in practice, deliberately distinct here:

| Tier | Effect | Reversible |
|---|---|---|
| **Suspend** | `banned = true`; sessions revoked immediately | ✅ |
| **Deactivate** | Listings archived; login retained | ✅ |
| **Anonymise** | PII removed; **property attribution preserved** | ❌ |

---

## 12. Rejected / Do Not Add

| Rejected | Why |
|---|---|
| **Offers on rent listings** | Rent is discovery, viewings and inquiries only (#1) |
| **Rental applications, screening, leases, recurring rent** | A second full domain; breadth not depth (#1) |
| **Agency / brokerage organizations** | Would add a permission dimension to every authorization check, permanently (#1) |
| **Agent subscription billing** | The least interesting kind of payment complexity (#1) |
| **Escrow, title, e-signature** | Out of scope (#1) |
| **Locking the property on offer acceptance** | Contradicts the commitment rule (#5, #11) |
| **Client-confirmed payment success** | The frontend is never authoritative (#13) |
| **A `City` or `District` model** | `Area` is a self-referencing hierarchy (#3) |
| **Global soft-delete** | Lifecycle states already express withdrawal (#6) |
| **Cash/kiosk deposits in v1** | Cannot complete inside the checkout hold (#13) |
| **Silent AI-initiated bookings** | All AI state changes require confirmation (#19) |
