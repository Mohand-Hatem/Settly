process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { buildAreaData, buildPropertyData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: Two-Party Sale Completion & Admin Review (P9, P9a, P10, O13, O14) Test Suite");
console.log("===============================================================================\n");

const PORT = 4011;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];
let areaId = null;
const propertyIds = [];
const offerIds = [];

function cookieOf(res) {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function signUp(label, { role = "USER", verified = true, phone = "+201001112233" } = {}) {
  const email = `test_sale_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Sale ${label}`, phone }),
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

const newKey = () => "test-sale-idempotency-" + randomUUID();

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    // 1. Fixture setup
    const agent = await signUp("agent", { role: "AGENT", verified: true, phone: "+201099990001" });
    await prisma.agentProfile.create({
      data: {
        id: randomUUID(),
        userId: agent.id,
        licenseNumber: "LIC-SALE-001",
        isVerified: true,
      },
    });

    const buyer1 = await signUp("buyer1", { role: "USER", verified: true, phone: "+201011110001" });
    const buyer2 = await signUp("buyer2", { role: "USER", verified: true, phone: "+201022220002" });
    const admin1 = await signUp("admin1", { role: "ADMIN", verified: true, phone: "+201033330003" });
    const adminConflicted = await signUp("admin2", { role: "ADMIN", verified: true, phone: "+201044440004" });

    const area = await prisma.area.create({ data: buildAreaData({ slug: `sale-area-${stamp}` }) });
    areaId = area.id;

    // Helper: create a property and an offer in RESERVED state with lead
    async function createReservedDeal(slugSuffix, customBuyerId = buyer1.id, customAgentId = agent.id) {
      const prop = await prisma.property.create({
        data: buildPropertyData(customAgentId, area.id, {
          titleEn: `Sale Test Property ${slugSuffix}`,
          slug: `sale-prop-${slugSuffix}-${stamp}`,
          price: 5000000n,
          status: "RESERVED",
          listingIntent: "SALE",
        }),
      });
      propertyIds.push(prop.id);

      // Create lead
      await prisma.lead.create({
        data: {
          id: randomUUID(),
          propertyId: prop.id,
          buyerId: customBuyerId,
          agentId: customAgentId,
          status: "CONTACTED",
        },
      });

      const offer = await prisma.offer.create({
        data: {
          id: randomUUID(),
          propertyId: prop.id,
          buyerId: customBuyerId,
          agentId: customAgentId,
          status: "RESERVED",
          expiresAt: new Date(Date.now() + 86400000),
          adminReviewDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      offerIds.push(offer.id);

      await prisma.offerRevision.create({
        data: {
          id: randomUUID(),
          offerId: offer.id,
          actorId: customBuyerId,
          revisionNumber: 1,
          amount: 4800000n,
        },
      });

      return { prop, offer };
    }

    const deal1 = await createReservedDeal("deal-1");
    console.log("✓ Fixtures created: Agent, Buyer 1, Buyer 2, Admin 1, Conflicted Admin, Reserved Deal 1\n");

    // Test 1: Unauthenticated and unauthorized users rejected
    console.log("Test 1: Unauthenticated and unauthorized users rejected");
    const unauthRes = await api("POST", `/api/v1/offers/${deal1.offer.id}/confirm-sale`, {
      key: newKey(),
    });
    assert.equal(unauthRes.status, 401, "Unauthenticated user gets 401");

    const unrelatedRes = await api("POST", `/api/v1/offers/${deal1.offer.id}/confirm-sale`, {
      cookie: buyer2.cookie,
      key: newKey(),
    });
    assert.equal(unrelatedRes.status, 403, "Unrelated buyer gets 403");

    const unrelatedDisputeRes = await api("POST", `/api/v1/offers/${deal1.offer.id}/dispute-sale`, {
      cookie: buyer2.cookie,
      key: newKey(),
      body: { reason: "I am not even part of this deal!" },
    });
    assert.equal(unrelatedDisputeRes.status, 403, "Unrelated buyer cannot dispute");
    console.log("✔ Authorization guards verified (401/403)\n");

    // Test 2: Two-party completion - Buyer confirms first
    console.log("Test 2: Buyer confirms first -> status remains RESERVED, buyerConfirmedAt populated");
    const buyerConfirmRes = await api("POST", `/api/v1/offers/${deal1.offer.id}/confirm-sale`, {
      cookie: buyer1.cookie,
      key: newKey(),
    });
    assert.equal(buyerConfirmRes.status, 200, "Buyer confirms sale successfully");
    assert.equal(buyerConfirmRes.body.status, "RESERVED");
    assert.ok(buyerConfirmRes.body.buyerConfirmedAt, "buyerConfirmedAt is populated");
    assert.equal(buyerConfirmRes.body.agentConfirmedAt, null, "agentConfirmedAt remains null");

    // Verify property in DB is still RESERVED
    const propCheck1 = await prisma.property.findUnique({ where: { id: deal1.prop.id } });
    assert.equal(propCheck1.status, "RESERVED", "Property remains RESERVED");
    console.log("✔ Buyer confirmation recorded without prematurely marking SOLD\n");

    // Test 3: Agent confirms second -> triggers atomic bundle: Offer COMPLETED, Property SOLD
    console.log("Test 3: Agent confirms second -> Offer COMPLETED, Property SOLD (P9, O13)");
    const agentConfirmRes = await api("POST", `/api/v1/offers/${deal1.offer.id}/confirm-sale`, {
      cookie: agent.cookie,
      key: newKey(),
    });
    assert.equal(agentConfirmRes.status, 200, "Agent confirms sale successfully");
    assert.equal(agentConfirmRes.body.status, "COMPLETED");
    assert.ok(agentConfirmRes.body.agentConfirmedAt, "agentConfirmedAt is populated");

    // Check DB state
    const propCheck2 = await prisma.property.findUnique({ where: { id: deal1.prop.id } });
    assert.equal(propCheck2.status, "SOLD", "Property transitioned to SOLD (P9)");

    const leadCheck1 = await prisma.lead.findFirst({ where: { propertyId: deal1.prop.id, buyerId: buyer1.id } });
    assert.equal(leadCheck1.status, "QUALIFIED", "Lead marked QUALIFIED upon sale completion (#83)");
    console.log("✔ Two-party completion bundle successfully executed (Offer COMPLETED, Property SOLD)\n");

    // Test 4: Invariant #102 - Agent cannot mark SOLD alone
    console.log("Test 4: Invariant #102 - Agent confirms first -> Offer stays RESERVED, never SOLD alone");
    const deal2 = await createReservedDeal("deal-2");
    const agentFirstRes = await api("POST", `/api/v1/offers/${deal2.offer.id}/confirm-sale`, {
      cookie: agent.cookie,
      key: newKey(),
    });
    assert.equal(agentFirstRes.status, 200, "Agent confirmation recorded");
    assert.equal(agentFirstRes.body.status, "RESERVED");
    assert.ok(agentFirstRes.body.agentConfirmedAt, "agentConfirmedAt is populated");
    assert.equal(agentFirstRes.body.buyerConfirmedAt, null, "buyerConfirmedAt is null");

    const propCheck3 = await prisma.property.findUnique({ where: { id: deal2.prop.id } });
    assert.equal(propCheck3.status, "RESERVED", "Property is NOT sold; remains RESERVED per Invariant #102");
    console.log("✔ Invariant #102 verified: Agent cannot mark listing SOLD alone\n");

    // Test 5: Dispute flow (P9a)
    console.log("Test 5: Buyer raises dispute -> Offer flagged for Admin Review (P9a)");
    const disputeRes = await api("POST", `/api/v1/offers/${deal2.offer.id}/dispute-sale`, {
      cookie: buyer1.cookie,
      key: newKey(),
      body: { reason: "Seller failed to deliver keys and title deed at notary." },
    });
    assert.equal(disputeRes.status, 200, "Dispute submitted");
    assert.ok(disputeRes.body.disputedAt, "disputedAt timestamp recorded");
    assert.equal(disputeRes.body.disputeReason, "Seller failed to deliver keys and title deed at notary.");
    console.log("✔ Dispute recorded with reason and timestamp\n");

    // Test 6: Admin sales list & detail (ADM-07)
    console.log("Test 6: Admin lists review queue and fetches sale detail");
    // Non-admin rejected
    const nonAdminList = await api("GET", "/api/v1/admin/sales", { cookie: buyer1.cookie });
    assert.equal(nonAdminList.status, 403, "Buyer cannot access admin sales");

    // Admin lists sales
    const adminListRes = await api("GET", "/api/v1/admin/sales?status=DISPUTED", { cookie: admin1.cookie });
    assert.equal(adminListRes.status, 200, "Admin lists disputed sales");
    assert.ok(adminListRes.body.items.length >= 1, "Disputed offer found");
    const foundDisputed = adminListRes.body.items.find((i) => i.id === deal2.offer.id);
    assert.ok(foundDisputed, "Offer 2 in admin list");
    assert.ok(foundDisputed.disputedAt, "disputedAt present");

    // Admin fetches detail
    const detailRes = await api("GET", `/api/v1/admin/sales/${deal2.offer.id}`, { cookie: admin1.cookie });
    assert.equal(detailRes.status, 200, "Admin fetches sale detail");
    assert.equal(detailRes.body.id, deal2.offer.id);
    assert.equal(detailRes.body.property.id, deal2.prop.id);
    console.log("✔ Admin list and detail endpoints verified (ADM-07)\n");

    // Test 7: Admin Conflict-of-Interest Guard (#67, #71)
    console.log("Test 7: Admin Conflict-of-Interest Guard (#67, #71)");
    // Create deal where adminConflicted is the buyer!
    const conflictedDeal = await createReservedDeal("conflicted", adminConflicted.id, agent.id);
    const conflictedConfirmRes = await api("POST", `/api/v1/admin/sales/${conflictedDeal.offer.id}/confirm`, {
      cookie: adminConflicted.cookie,
      key: newKey(),
      body: { notes: "I am approving my own purchase." },
    });
    assert.equal(conflictedConfirmRes.status, 403, "Conflicted admin gets 403");
    assert.equal(conflictedConfirmRes.body.type, "/errors/admin-conflict-of-interest");
    console.log("✔ Conflicted admin strictly barred from adjudicating own deal (#67, #71)\n");

    // Test 8: Admin extends review deadline
    console.log("Test 8: Uninvolved admin extends review period");
    const extendRes = await api("POST", `/api/v1/admin/sales/${deal2.offer.id}/extend`, {
      cookie: admin1.cookie,
      key: newKey(),
      body: { days: 14, notes: "Awaiting legal clarification from registry." },
    });
    assert.equal(extendRes.status, 200, "Admin extends review");
    assert.ok(extendRes.body.adminReviewDeadline, "Deadline updated");
    console.log("✔ Admin successfully extended review deadline\n");

    // Test 9: Admin declares sale fell through (P10, O14)
    console.log("Test 9: Admin declares fell through -> Offer FELL_THROUGH, Property PUBLISHED (P10, O14)");
    const fellThroughRes = await api("POST", `/api/v1/admin/sales/${deal2.offer.id}/fell-through`, {
      cookie: admin1.cookie,
      key: newKey(),
      body: {
        cause: "ADMIN_DETERMINATION",
        reason: "Title deed invalidated during official verification.",
        notes: "Seller cannot provide clean registry proof.",
      },
    });
    assert.equal(fellThroughRes.status, 200, "Admin declared fell through");
    assert.equal(fellThroughRes.body.status, "FELL_THROUGH");
    assert.equal(fellThroughRes.body.adminReviewDecision, "FELL_THROUGH");

    const propCheck4 = await prisma.property.findUnique({ where: { id: deal2.prop.id } });
    assert.equal(propCheck4.status, "PUBLISHED", "Property returned to PUBLISHED (P10)");
    console.log("✔ Admin fell-through resolution verified (P10, O14)\n");

    // Test 10: Admin confirms sale completion directly
    console.log("Test 10: Uninvolved admin confirms sale -> Offer COMPLETED, Property SOLD");
    const deal3 = await createReservedDeal("deal-3");
    const adminConfirmRes = await api("POST", `/api/v1/admin/sales/${deal3.offer.id}/confirm`, {
      cookie: admin1.cookie,
      key: newKey(),
      body: { notes: "Both parties signed notary deed in front of admin." },
    });
    assert.equal(adminConfirmRes.status, 200, "Admin confirms sale");
    assert.equal(adminConfirmRes.body.status, "COMPLETED");
    assert.equal(adminConfirmRes.body.adminReviewDecision, "CONFIRMED_SOLD");

    const propCheck5 = await prisma.property.findUnique({ where: { id: deal3.prop.id } });
    assert.equal(propCheck5.status, "SOLD", "Property marked SOLD via admin confirmation");
    console.log("✔ Admin direct confirmation verified\n");

    console.log("===============================================================================");
    console.log("🎉 ALL 10 SALE COMPLETION & ADMIN REVIEW TESTS PASSED PERFECTLY!");
    console.log("===============================================================================");
  } finally {
    // Cleanup
    try {
      if (offerIds.length > 0) {
        await prisma.offerRevision.deleteMany({ where: { offerId: { in: offerIds } } });
        await prisma.payment.deleteMany({ where: { offerId: { in: offerIds } } });
        await prisma.offer.deleteMany({ where: { id: { in: offerIds } } });
      }
      if (propertyIds.length > 0) {
        await prisma.lead.deleteMany({ where: { propertyId: { in: propertyIds } } });
        await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
      }
      if (areaId) {
        await prisma.area.delete({ where: { id: areaId } }).catch(() => {});
      }
      for (const uid of userIds) {
        await prisma.agentProfile.deleteMany({ where: { userId: uid } });
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
