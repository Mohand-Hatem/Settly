# Concurrency & Idempotency

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #10, #11, #35, #38, #42
    Related:      DATABASE.md, PAYMENTS.md, ../product/BUSINESS_RULES.md

## 1. Purpose

Every race condition in Settly, the mechanism that resolves it, and why that mechanism is the
minimum sufficient one. This is the most load-bearing document in the architecture — it makes
Decision #10 verifiable rather than merely asserted.

## 2. Governing principle

> **Correctness lives in database constraints and conditional updates. Isolation levels and locks
> are escalations, used only where constraints cannot express the rule.**

Default isolation: `READ COMMITTED`. A blocked `UPDATE ... WHERE id=? AND status=?` re-evaluates
its `WHERE` clause against the new row version once the lock releases — a genuine atomic
compare-and-swap. Because every state-machine transition changes a status column, **the state
machines get optimistic concurrency for free**: no version column, no retry loop, zero rows
affected means you lost. `SERIALIZABLE` is used nowhere.

## 3. Race inventory

| # | Race | Mechanism |
|---|---|---|
| R1 | Two funded deposits on one property | **Partial unique index** on `propertyId` WHERE offer status IN (RESERVED, COMPLETED) |
| R2 | Duplicate webhook delivery | Unique `(provider, providerEventId)` |
| R3 | Out-of-order webhooks | State-machine guards — `SUCCEEDED` never downgrades |
| R4 | Overlapping viewings | **Exclusion constraint** on `(agentId, tstzrange(startsAt,endsAt))` WHERE CONFIRMED |
| R5 | Buyer counters while agent accepts | Conditional update (status CAS) |
| R6 | Double-click pay | Idempotency key + partial unique (one non-terminal `PaymentAttempt` per `Payment`) |
| R7 | Retry during in-flight webhook | Conditional `PENDING → PROCESSING` |
| R8 | Concurrent partial refunds | `SELECT ... FOR UPDATE` on `Payment` |
| **R9** | I9/I11/I12 — max viewing requests / saved searches / live offers | **Transaction-scoped advisory lock**, one shared namespace keyed on `userId` |
| R10 | Duplicate saved-search alerts | Unique `(savedSearchId, propertyId)` |
| R11 | Agent edits while admin moderates | Conditional update |
| R12 | Two subscription checkouts at once (#105) | Partial unique index on `SubscriptionPayment(agentId)` WHERE status IN (PENDING, PROCESSING) |
| R13 | Overlapping or double-queued subscription periods (#105) | Exclusion constraint on `(subscriptionId, tstzrange(startsAt, coalesce(endedEarlyAt, endsAt)))` + partial unique WHERE `SCHEDULED` |
| R14 | Upgrade racing a quota-consuming approval (#105, I13) | Upgrade takes the per-user advisory lock (R9 namespace) before switching periods and releasing waiting listings |

**9 of 11 resolved by a constraint or conditional update. Exactly 2 escalate to a lock** — this
ratio is the point of the design.

## 4. The advisory-lock invariants (I9, I11, I12, I13)

All three share the shape "at most N rows matching a predicate for this user" and are **write-skew
vulnerable** — two concurrent requests each count N-1 existing rows, both pass, the user ends with
N+1. No `WHERE` clause is violated, so `READ COMMITTED` alone cannot prevent it, and no unique
constraint can express "at most N."

```
  BEGIN
    pg_advisory_xact_lock(hashtext(userId))   -- one namespace, all three invariants
    SELECT count(*) WHERE <predicate> -- e.g. open viewing requests
    IF count >= limit: ABORT with quota-exceeded
    INSERT ...
  COMMIT  -- lock released automatically
```

| Invariant | Limit | Predicate |
|---|---|---|
| I9 | 3 | Open viewing requests (`REQUESTED`+`RESCHEDULE_PROPOSED`) |
| I11 | 25 | Saved searches |
| I12 | 5 | **Live** offers = `{PENDING_AGENT, PENDING_BUYER, ACCEPTED, RESERVED}` (Decision #38) |
| I13 | Agent's active plan: 2 / 4 / 8 | The agent's **first publications** in the current calendar month (Cairo). Lock keyed on the **listing's agent**, taken in the approval/publication operation (P3, P3a); the "insert" is the publication (#95) |

⚠️ **A naive count-then-insert is incorrect for all four** — this is a common implementation
mistake to guard against explicitly.

## 5. The deposit race and the checkout hold (Decision #11)

Because the deposit — not offer acceptance — is the commitment point, multiple offers may sit in
`ACCEPTED` and race to fund. A **15-minute exclusive checkout hold**, acquired by conditional
update on `Property` (`SET hold WHERE id=? AND (holdOfferId IS NULL OR holdExpiresAt < now())`),
moves contention from *after* money moves to *before* it. The hold grants no rights and reserves
nothing legally. Residual races (hold expires mid-payment) fall back to the automatic-refund path.
Full sequence: `PAYMENTS.md` Section on the atomic bundle.

## 6. Idempotency

**Four endpoints require a client `Idempotency-Key`**: create payment attempt, request refund,
create viewing request, submit offer. Keys live in **Postgres, not Redis** — they must be durable
and commit atomically with the operation they protect.

```
  INSERT (userId, key, requestHash, status=IN_PROGRESS)
    unique violation → COMPLETED+hash matches: replay stored response, original status
                     → COMPLETED+hash differs: 422 idempotency-key-reused
                     → IN_PROGRESS: 409 + Retry-After
    inserted        → execute → store response → COMPLETED
```

Webhooks use a different key source (provider event id, R2). Jobs use deterministic BullMQ job
ids (e.g. `embed:{propertyId}:{contentHash}`).

## 7. Transaction inventory

| # | Operation | Atomic writes |
|---|---|---|
| T1 | **Deposit webhook** | WebhookEvent, Payment, PaymentAttempt, Offer→RESERVED, Property→RESERVED, rival Offers→SUPERSEDED, rival Payments→CANCELLED, Lead, Notification rows, AuditLog |
| T2 | Offer acceptance | Offer→ACCEPTED, create Payment(PENDING), Notification, AuditLog |
| T3 | Viewing confirmation | Viewing→CONFIRMED, auto-decline rivals, Lead, Notification, AuditLog |
| T4 | Property publish | Property→PUBLISHED, embeddingStatus→PENDING, Notification, AuditLog |
| T5a/b | Refund | Recoverable 3-step: request → provider call → result |
| ~~T6~~ | ~~Offline sale (P11)~~ | **Retired by #102** (P11 removed). The atomic writes of two-party sale completion (P9 + O13) are designed with that flow |
| T7 | Message send | Conversation upsert, Message, Notification |
| T8 | **Subscription webhook** (#105) | WebhookEvent, SubscriptionPayment→SUCCEEDED, SubscriptionPaymentAttempt, SubscriptionPeriod created (`ACTIVE` or `SCHEDULED`), Notification rows, AuditLog. An unapplicable success is flagged for admin review instead |
| T9 | **Subscription upgrade activation** (#105) | Under the per-user lock: current period→SUPERSEDED (`endedEarlyAt`), new UPGRADE period ACTIVE, waiting listings P3a in FIFO order, Notification, AuditLog |

**Rule: no external I/O and no BullMQ enqueue inside a transaction.** Enqueue after commit;
sweepers cover any lost enqueue.

## 8. Enqueue-after-commit and the sweeper pattern

No generic outbox model. Every async workload gets a durable status column plus a sweeper:

| Scheduled job | Drives |
|---|---|
| `payment.reconcile` (1m) | Y4 when a webhook never arrives |
| `deposit.expire` / `offer.expire` (5m) | O9/Y6, O10 |
| `viewing.expire` (15m) | V10 |
| `checkout-hold.expire` (1m) | Section 5 |
| `notification.sweep` (60s) | Undelivered notification retry |
| `idempotency.cleanup` (1h) | 24h key expiry |
| `session.cleanup` (daily) | Expired session/token removal |
| `matview.refresh` (nightly) | Area/insights aggregates |
| Revocation-review deadline (#64, #69) | Auto-cancel an unreviewed reserved listing with a 100% refund after 5 business days — schedule and name TBD |
| Sale-completion review (#77, #82) | Move a reservation without both confirmations into admin review after 30 days — schedule and name TBD |
| **`embedding.drift` (per #42)** | Detects `Embedding.visibilityScope` mismatched with its source — non-zero count is a **security incident** |

Frozen items (#63) are skipped by the expiry jobs; their clocks resume with the remaining time.
The monthly quota reset is the calendar month (#88); usage is counted from first publications, so no
reset job is required for counting. Automatic FIFO publication of listings waiting for quota after a
reset or upgrade (#94, P3a) is system-driven; its trigger/scheduling is an implementation detail.

## 9. Race testing (see process/TESTING.md for the full layer)

Every entry in Section 3 has a corresponding concurrency test — real Postgres, serial execution,
never retried. A flaky concurrency test is a finding, not a nuisance.

## 10. Pending verification

V11/V32 (btree_gist availability) affect R4's implementation. V33 (does `prisma migrate` preserve
hand-written constraints/triggers) affects whether the exclusion constraint and AuditLog rule
survive schema regeneration.

## 11. Rejected / do not add

`SERIALIZABLE` as a default · row-level locks where a conditional update suffices · a generic
distributed-lock service (Postgres advisory locks are already transactional, no extra failure
domain) · retrying concurrency tests to hide flakiness.

## 12. Related documents

`PAYMENTS.md` for the full payment/webhook sequence · `../product/BUSINESS_RULES.md` for the
state machines these mechanisms protect · `../process/TESTING.md` for the concurrency test layer.
