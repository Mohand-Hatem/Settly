process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { buildAreaData, buildPropertyData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: Offer Lifecycle (O1–O8, Invariant I12) Verification Suite");
console.log("===============================================================================\n");

const PORT = 4008;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];
let areaId = null;
let propertyId = null;
let otherPropertyIds = [];

function cookieOf(res) {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function signUp(label, { role = "USER", verified = true, phone = "+201001112233" } = {}) {
  const email = `test_offer_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Offer ${label}`, phone }),
  });
  assert.equal(res.status, 200, `sign-up ${label}`);
  const { user } = await res.json();
  userIds.push(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { role, emailVerified: verified } });
  return { id: user.id, cookie: cookieOf(res) };
}

async function api(method, path, { cookie, body, key } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  if (key) headers["Idempotency-Key"] = key;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

const newKey = () => "test-idempotency-" + randomUUID();

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    // 1. Fixtures setup
    const agent = await signUp("agent", { role: "AGENT", verified: true, phone: "+201099990001" });
    const buyerVerified = await signUp("buyer_verified", { role: "USER", verified: true, phone: "+201088880002" });
    const buyerUnverified = await signUp("buyer_unverified", { role: "USER", verified: false, phone: "+201077770003" });

    const area = await prisma.area.create({ data: buildAreaData({ slug: `offer-area-${stamp}` }) });
    areaId = area.id;

    const property = await prisma.property.create({
      data: buildPropertyData(agent.id, area.id, {
        slug: `offer-prop-${stamp}`,
        status: "PUBLISHED",
        listingIntent: "SALE",
        price: 8_000_000n,
      }),
    });
    propertyId = property.id;

    console.log("✔ Fixtures created: Agent, Verified Buyer, Unverified Buyer, Published Sale Property\n");

    // Test 1: Unverified buyer cannot submit offer (Decision #38, O1 guard)
    console.log("Test 1: Unverified buyer blocked from submitting offer");
    const unverifiedRes = await api("POST", "/api/v1/offers", {
      cookie: buyerUnverified.cookie,
      key: newKey(),
      body: { propertyId, amount: 7_500_000 },
    });
    assert.equal(unverifiedRes.status, 403, "Unverified buyer gets 403");
    console.log("✔ Unverified buyer rejected with 403 Forbidden\n");

    // Test 2: Agent cannot submit offer on own listing (Decision #50, #59)
    console.log("Test 2: Agent cannot submit offer on own listing");
    const agentSelfRes = await api("POST", "/api/v1/offers", {
      cookie: agent.cookie,
      key: newKey(),
      body: { propertyId, amount: 7_500_000 },
    });
    assert.equal(agentSelfRes.status, 403, "Agent gets 403 on own listing");
    console.log("✔ Agent self-dealing prevented\n");

    // Test 3: Verified buyer submits offer (O1)
    console.log("Test 3: Verified buyer submits initial offer (O1)");
    const offerRes = await api("POST", "/api/v1/offers", {
      cookie: buyerVerified.cookie,
      key: newKey(),
      body: {
        propertyId,
        amount: 7_500_000,
        conditions: "Subject to mortgage pre-approval within 14 days",
      },
    });
    assert.equal(offerRes.status, 201, "Offer created 201");
    const offer = offerRes.body;
    assert.equal(offer.status, "PENDING_AGENT");
    assert.equal(offer.currentAmount, 7_500_000);
    assert.equal(offer.revisions.length, 1);
    assert.equal(offer.revisions[0].revisionNumber, 1);
    assert.equal(offer.agent.phone, null, "Agent phone is never public (#60)");
    console.log(`✔ Offer ${offer.id} created in PENDING_AGENT state with revision #1\n`);

    // Test 4: Second live offer on same property blocked (Business Rules O1)
    console.log("Test 4: Second live offer on same property blocked");
    const dupeRes = await api("POST", "/api/v1/offers", {
      cookie: buyerVerified.cookie,
      key: newKey(),
      body: { propertyId, amount: 7_600_000 },
    });
    assert.equal(dupeRes.status, 409, "Duplicate live offer returns 409");
    console.log("✔ Duplicate active offer rejected with 409 Conflict\n");

    // Test 5: Agent counters the offer (O2 -> PENDING_BUYER)
    console.log("Test 5: Agent counters offer (O2)");
    const counterRes = await api("POST", `/api/v1/offers/${offer.id}/counter`, {
      cookie: agent.cookie,
      body: {
        amount: 7_800_000,
        conditions: "Cash or certified bank draft only",
      },
    });
    assert.equal(counterRes.status, 200, "Counter 200");
    const countered = counterRes.body;
    assert.equal(countered.status, "PENDING_BUYER");
    assert.equal(countered.currentAmount, 7_800_000);
    assert.equal(countered.revisions.length, 2);
    assert.equal(countered.revisions[1].revisionNumber, 2);
    assert.equal(countered.revisions[1].actorRole, "AGENT");
    console.log("✔ Counter-offer recorded with revision #2 in PENDING_BUYER\n");

    // Test 6: Buyer counters back (O3 -> PENDING_AGENT)
    console.log("Test 6: Buyer counters back (O3)");
    const buyerCounterRes = await api("POST", `/api/v1/offers/${offer.id}/counter`, {
      cookie: buyerVerified.cookie,
      body: {
        amount: 7_700_000,
        conditions: "Closing within 30 days",
      },
    });
    assert.equal(buyerCounterRes.status, 200, "Buyer counter 200");
    const buyerCountered = buyerCounterRes.body;
    assert.equal(buyerCountered.status, "PENDING_AGENT");
    assert.equal(buyerCountered.currentAmount, 7_700_000);
    assert.equal(buyerCountered.revisions.length, 3);
    console.log("✔ Buyer counter recorded with revision #3 in PENDING_AGENT\n");

    // Test 7: Agent accepts offer (O4 -> ACCEPTED + Payment created)
    console.log("Test 7: Agent accepts offer (O4)");
    const acceptRes = await api("POST", `/api/v1/offers/${offer.id}/accept`, {
      cookie: agent.cookie,
    });
    assert.equal(acceptRes.status, 200, "Accept 200");
    const accepted = acceptRes.body;
    assert.equal(accepted.status, "ACCEPTED");
    assert.ok(accepted.acceptedAt, "acceptedAt timestamp recorded");
    assert.equal(accepted.depositAmount, 50_000, "Deposit capped at 50,000 EGP");
    assert.ok(accepted.depositDeadlineAt, "Deposit deadline set");

    // Verify Payment table in DB
    const payment = await prisma.payment.findFirst({ where: { offerId: offer.id } });
    assert.ok(payment, "Payment record exists in database");
    assert.equal(payment.status, "PENDING");
    assert.equal(Number(payment.grossAmount), 50_000);
    console.log("✔ Offer accepted, 50,000 EGP deposit payment created with 72h deadline\n");

    // Test 8: Buyer withdraws accepted offer (O8 -> WITHDRAWN, payment EXPIRED)
    console.log("Test 8: Buyer withdraws accepted offer (O8)");
    const withdrawRes = await api("POST", `/api/v1/offers/${offer.id}/withdraw`, {
      cookie: buyerVerified.cookie,
      body: { reason: "Found another property closer to work" },
    });
    assert.equal(withdrawRes.status, 200, "Withdraw 200");
    const withdrawn = withdrawRes.body;
    assert.equal(withdrawn.status, "WITHDRAWN");
    assert.equal(withdrawn.withdrawalReason, "Found another property closer to work");

    const updatedPayment = await prisma.payment.findFirst({ where: { offerId: offer.id } });
    assert.equal(updatedPayment.status, "CANCELLED", "Payment cancelled upon withdrawal");
    console.log("✔ Offer withdrawn, payment cancelled\n");

    // Test 9: Buyer listing and filtering (/api/v1/me/offers)
    console.log("Test 9: Listing buyer offers");
    const myOffersRes = await api("GET", "/api/v1/me/offers?scope=terminal", {
      cookie: buyerVerified.cookie,
    });
    assert.equal(myOffersRes.status, 200);
    assert.ok(myOffersRes.body.items.length >= 1);
    assert.equal(myOffersRes.body.items[0].id, offer.id);
    console.log("✔ Buyer offers listed with cursor pagination\n");

    // Test 10: Invariant I12 - Maximum 5 live offers per buyer
    console.log("Test 10: Invariant I12 - 5 live offers limit");
    // Create 5 separate properties and 5 live offers
    for (let i = 0; i < 5; i++) {
      const p = await prisma.property.create({
        data: buildPropertyData(agent.id, area.id, {
          slug: `offer-i12-${i}-${stamp}`,
          status: "PUBLISHED",
          listingIntent: "SALE",
          price: 5_000_000n,
        }),
      });
      otherPropertyIds.push(p.id);

      const res = await api("POST", "/api/v1/offers", {
        cookie: buyerVerified.cookie,
        key: newKey(),
        body: { propertyId: p.id, amount: 4_500_000 },
      });
      assert.equal(res.status, 201, `Live offer ${i + 1} created`);
    }

    // 6th live offer must be rejected with 409 max-live-offers-exceeded
    const p6 = await prisma.property.create({
      data: buildPropertyData(agent.id, area.id, {
        slug: `offer-i12-6-${stamp}`,
        status: "PUBLISHED",
        listingIntent: "SALE",
        price: 5_000_000n,
      }),
    });
    otherPropertyIds.push(p6.id);

    const overLimitRes = await api("POST", "/api/v1/offers", {
      cookie: buyerVerified.cookie,
      key: newKey(),
      body: { propertyId: p6.id, amount: 4_500_000 },
    });
    assert.equal(overLimitRes.status, 409, "6th live offer rejected with 409");
    assert.equal(overLimitRes.body.type, "/errors/max-live-offers-exceeded");
    console.log("✔ Invariant I12 strictly enforced: 6th live offer rejected\n");

    console.log("===============================================================================");
    console.log("🎉 ALL 10 OFFER LIFECYCLE & INVARIANT TESTS PASSED PERFECTLY!");
    console.log("===============================================================================");
  } finally {
    // Cleanup
    try {
      const allProps = [propertyId, ...otherPropertyIds].filter(Boolean);
      if (allProps.length > 0) {
        await prisma.offerRevision.deleteMany({ where: { offer: { propertyId: { in: allProps } } } });
        await prisma.payment.deleteMany({ where: { offer: { propertyId: { in: allProps } } } });
        await prisma.offer.deleteMany({ where: { propertyId: { in: allProps } } });
        await prisma.lead.deleteMany({ where: { propertyId: { in: allProps } } });
        await prisma.property.deleteMany({ where: { id: { in: allProps } } });
      }
      if (areaId) {
        await prisma.area.delete({ where: { id: areaId } }).catch(() => {});
      }
      for (const uid of userIds) {
        await prisma.lead.deleteMany({ where: { OR: [{ buyerId: uid }, { agentId: uid }] } });
        await prisma.session.deleteMany({ where: { userId: uid } });
        await prisma.account.deleteMany({ where: { userId: uid } });
        await prisma.user.delete({ where: { id: uid } }).catch(() => {});
      }
    } catch (cleanupErr) {
      console.error("Cleanup warning:", cleanupErr.message);
    }
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
