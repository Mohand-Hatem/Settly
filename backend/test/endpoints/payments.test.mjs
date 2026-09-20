process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { paymobAdapter } from "../../dist/modules/payments/adapter/paymob.adapter.js";
import { buildAreaData, buildPropertyData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: Payments & Deposit Concurrency (T1, BUY-08, BUY-09) Test Suite");
console.log("===============================================================================\n");

const PORT = 4009;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];
let areaId = null;
let propertyId = null;
let offer1Id = null;
let offer2Id = null;

function cookieOf(res) {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function signUp(label, { role = "USER", verified = true, phone = "+201001112233" } = {}) {
  const email = `test_pay_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Payment ${label}`, phone }),
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

const newKey = () => "test-pay-idempotency-" + randomUUID();

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
        licenseNumber: "LIC-PAY-001",
        isVerified: true,
      },
    });

    const buyer1 = await signUp("buyer1", { role: "USER", verified: true, phone: "+201011110001" });
    const buyer2 = await signUp("buyer2", { role: "USER", verified: true, phone: "+201022220002" });
    const unverifiedBuyer = await signUp("unverified", { role: "USER", verified: false, phone: "+201033330003" });

    // Seed area & property (5,000,000 EGP price -> 5% = 250,000 capped at 50,000 EGP)
    const area = await prisma.area.create({ data: buildAreaData({ slug: `pay-area-${stamp}` }) });
    areaId = area.id;

    const property = await prisma.property.create({
      data: buildPropertyData(agent.id, area.id, {
        titleEn: "Luxury Penthouse in New Cairo",
        price: 5000000n,
        status: "PUBLISHED",
        listingIntent: "SALE",
      }),
    });
    propertyId = property.id;

    console.log("✓ Fixtures created (Property price: 5,000,000 EGP)");

    // 2. Buyer 1 submits Offer 1 -> Agent accepts
    const o1Res = await api("POST", "/api/v1/offers", {
      cookie: buyer1.cookie,
      key: newKey(),
      body: { propertyId, amount: 4800000 },
    });
    assert.equal(o1Res.status, 201, "Buyer 1 creates offer");
    offer1Id = o1Res.body.id;

    const accept1Res = await api("POST", `/api/v1/offers/${offer1Id}/accept`, {
      cookie: agent.cookie,
      key: newKey(),
    });
    assert.equal(accept1Res.status, 200, "Agent accepts Buyer 1 offer");
    assert.equal(accept1Res.body.status, "ACCEPTED");
    assert.equal(accept1Res.body.depositAmount, 50000, "5% deposit capped at 50,000 EGP");

    // 3. Buyer 2 submits Offer 2 -> Agent accepts (two accepted offers racing per §6)
    const o2Res = await api("POST", "/api/v1/offers", {
      cookie: buyer2.cookie,
      key: newKey(),
      body: { propertyId, amount: 4900000 },
    });
    assert.equal(o2Res.status, 201, "Buyer 2 creates offer");
    offer2Id = o2Res.body.id;

    const accept2Res = await api("POST", `/api/v1/offers/${offer2Id}/accept`, {
      cookie: agent.cookie,
      key: newKey(),
    });
    assert.equal(accept2Res.status, 200, "Agent accepts Buyer 2 offer");
    console.log("✓ Two offers accepted and racing for reservation (§6)");

    // 4. Test: Unverified email gate on deposit checkout (§9.1)
    const unverifiedCheckout = await api("POST", `/api/v1/offers/${offer1Id}/deposit/checkout`, {
      cookie: unverifiedBuyer.cookie,
      key: newKey(),
    });
    assert.equal(unverifiedCheckout.status, 403, "Unverified buyer blocked from checkout");
    console.log("✓ Unverified email blocked at checkout (403)");

    // 5. Test: Buyer 1 initiates checkout -> acquires 15-minute checkout hold
    const checkout1 = await api("POST", `/api/v1/offers/${offer1Id}/deposit/checkout`, {
      cookie: buyer1.cookie,
      key: newKey(),
      body: { returnUrl: "http://localhost:3000/callback" },
    });
    assert.equal(checkout1.status, 200, "Buyer 1 initiates checkout");
    assert.equal(checkout1.body.amountEgp, 50000);
    assert.equal(checkout1.body.orderReference, `dep_${offer1Id}`);
    assert.ok(checkout1.body.checkoutUrl, "Returns hosted checkout URL");
    console.log("✓ Buyer 1 acquired 15-minute checkout hold and Paymob session (Decision #11)");

    // Verify property hold in DB
    const propCheck = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { checkoutHoldUserId: true, checkoutHoldExpiresAt: true },
    });
    assert.equal(propCheck.checkoutHoldUserId, buyer1.id);
    assert.ok(propCheck.checkoutHoldExpiresAt > new Date());

    // 6. Test: Buyer 2 attempts checkout while hold is active -> 409 Conflict
    const checkout2 = await api("POST", `/api/v1/offers/${offer2Id}/deposit/checkout`, {
      cookie: buyer2.cookie,
      key: newKey(),
    });
    assert.equal(checkout2.status, 409, "Buyer 2 blocked by active checkout hold");
    assert.match(checkout2.body.detail, /Another buyer is currently completing checkout/i);
    console.log("✓ Concurrency protection: rival checkout rejected with 409 checkout-hold-active");

    // 7. Test: Polling status endpoint (SH-05)
    const status1 = await api("GET", `/api/v1/offers/${offer1Id}/deposit/status`, {
      cookie: buyer1.cookie,
    });
    assert.equal(status1.status, 200);
    assert.equal(status1.body.paymentStatus, "PROCESSING");
    assert.equal(status1.body.isHeldByCaller, true);
    assert.equal(status1.body.anotherBuyerHolding, false);

    const status2 = await api("GET", `/api/v1/offers/${offer2Id}/deposit/status`, {
      cookie: buyer2.cookie,
    });
    assert.equal(status2.status, 200);
    assert.equal(status2.body.paymentStatus, "PENDING");
    assert.equal(status2.body.anotherBuyerHolding, true);
    console.log("✓ Status polling accurately reports hold state to both buyers (SH-05)");

    // 8. Test: Webhook HMAC security rejection
    const invalidWebhook = await api("POST", "/api/v1/payments/webhook/paymob?hmac=invalid_signature_hex", {
      body: { obj: { id: 9999 } },
    });
    assert.equal(invalidWebhook.status, 401, "Webhook rejects invalid HMAC signature");
    console.log("✓ Webhook rejects invalid HMAC signature (401)");

    // 9. Test: Valid Webhook triggers Atomic Bundle T1
    const webhookPayload = {
      obj: {
        id: 12345678,
        amount_cents: 5000000, // 50,000 EGP * 100
        currency: "EGP",
        success: true,
        pending: false,
        order: {
          id: 88888,
          merchant_order_id: `dep_${offer1Id}`,
        },
        source_data: {
          type: "card",
          sub_type: "MasterCard",
          pan: "2345",
        },
        created_at: new Date().toISOString(),
        error_occured: false,
        has_parent_transaction: false,
        integration_id: 1111,
        is_3d_secure: true,
        is_auth: false,
        is_capture: true,
        is_refunded: false,
        is_standalone_payment: false,
        is_voided: false,
        owner: 100,
      },
    };

    const validSignature = paymobAdapter.generateWebhookSignature(webhookPayload);
    const webhookRes = await api("POST", `/api/v1/payments/webhook/paymob?hmac=${validSignature}`, {
      body: webhookPayload,
    });
    assert.equal(webhookRes.status, 200, "Valid webhook accepted");
    console.log("webhookRes:", webhookRes.body);
    assert.equal(webhookRes.body.success, true);
    console.log("✓ Webhook HMAC validated and Atomic Bundle executed (T1)");

    // 10. Verify post-webhook state machine transitions:
    // a. Offer 1 -> RESERVED
    const o1Final = await prisma.offer.findUnique({ where: { id: offer1Id } });
    assert.equal(o1Final.status, "RESERVED", "Offer 1 transitioned to RESERVED");

    // b. Property -> RESERVED and hold cleared
    const propFinal = await prisma.property.findUnique({ where: { id: propertyId } });
    assert.equal(propFinal.status, "RESERVED", "Property transitioned to RESERVED");
    assert.equal(propFinal.checkoutHoldExpiresAt, null, "Checkout hold cleared");

    // c. Payment 1 -> SUCCEEDED
    const p1Final = await prisma.payment.findFirst({ where: { offerId: offer1Id } });
    assert.equal(p1Final.status, "SUCCEEDED", "Payment 1 transitioned to SUCCEEDED");
    assert.ok(p1Final.paidAt, "PaidAt timestamp recorded");

    // d. Rival Offer 2 -> SUPERSEDED (O12)
    const o2Final = await prisma.offer.findUnique({ where: { id: offer2Id } });
    assert.equal(o2Final.status, "SUPERSEDED", "Rival Offer 2 transitioned to SUPERSEDED");

    // e. Rival Payment 2 -> CANCELLED
    const p2Final = await prisma.payment.findFirst({ where: { offerId: offer2Id } });
    assert.equal(p2Final.status, "CANCELLED", "Rival Payment 2 transitioned to CANCELLED");

    console.log("✓ Invariant check: Offer RESERVED, Property RESERVED, Rival offer SUPERSEDED, Rival payment CANCELLED");

    // 11. Test: Webhook Idempotency (duplicate payload)
    const duplicateRes = await api("POST", `/api/v1/payments/webhook/paymob?hmac=${validSignature}`, {
      body: webhookPayload,
    });
    assert.equal(duplicateRes.status, 200);
    assert.equal(duplicateRes.body.reason, "already_processed", "Duplicate webhook handled idempotently");
    console.log("✓ Webhook deduplication: duplicate event ignored safely (200 OK)");

    console.log("\n===============================================================================");
    console.log("ALL PAYMENTS & DEPOSIT CONCURRENCY TESTS PASSED GREEN (100%)");
    console.log("===============================================================================");
  } finally {
    // Cleanup
    try {
      if (offer1Id || offer2Id) {
        await prisma.paymentAttempt.deleteMany({
          where: { payment: { offerId: { in: [offer1Id, offer2Id].filter(Boolean) } } },
        }).catch(() => {});
        await prisma.payment.deleteMany({
          where: { offerId: { in: [offer1Id, offer2Id].filter(Boolean) } },
        }).catch(() => {});
        await prisma.offerRevision.deleteMany({
          where: { offerId: { in: [offer1Id, offer2Id].filter(Boolean) } },
        }).catch(() => {});
        await prisma.offer.deleteMany({
          where: { id: { in: [offer1Id, offer2Id].filter(Boolean) } },
        }).catch(() => {});
      }
      if (propertyId) {
        await prisma.lead.deleteMany({ where: { propertyId } }).catch(() => {});
        await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
      }
      if (areaId) {
        await prisma.area.delete({ where: { id: areaId } }).catch(() => {});
      }
      await prisma.webhookEvent.deleteMany({ where: { eventId: "12345678" } }).catch(() => {});
      for (const uid of userIds) {
        await prisma.lead.deleteMany({ where: { OR: [{ buyerId: uid }, { agentId: uid }] } }).catch(() => {});
        await prisma.agentProfile.deleteMany({ where: { userId: uid } }).catch(() => {});
        await prisma.session.deleteMany({ where: { userId: uid } }).catch(() => {});
        await prisma.account.deleteMany({ where: { userId: uid } }).catch(() => {});
        await prisma.user.delete({ where: { id: uid } }).catch(() => {});
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }
    await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  server.close();
  process.exit(1);
});
