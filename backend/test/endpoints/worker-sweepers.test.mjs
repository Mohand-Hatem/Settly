process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { offerService } from "../../dist/modules/pipeline/index.js";
import { paymentService } from "../../dist/modules/payments/index.js";
import { identityService } from "../../dist/modules/identity/index.js";
import { pruneExpiredIdempotencyKeys } from "../../dist/shared/database/idempotency.js";
import { buildAreaData, buildPropertyData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: Background Worker Sweepers & Expiry Verification Suite");
console.log("===============================================================================\n");

const PORT = 4018;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];
let areaId = null;
let propertyId = null;

async function signUp(label, { role = "USER", verified = true, phone = "+201001112233" } = {}) {
  const email = `test_sweeper_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Sweeper ${label}`, phone }),
  });
  assert.equal(res.status, 200, `sign-up ${label}`);
  const { user } = await res.json();
  userIds.push(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { role, emailVerified: verified } });
  return { id: user.id };
}

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    // 1. Setup fixtures
    const agent = await signUp("agent", { role: "AGENT", verified: true, phone: "+201099990018" });
    const buyer = await signUp("buyer", { role: "USER", verified: true, phone: "+201099990019" });

    const area = await prisma.area.create({ data: buildAreaData({ slug: `sweeper-area-${stamp}` }) });
    areaId = area.id;

    const property = await prisma.property.create({
      data: buildPropertyData(agent.id, area.id, {
        slug: `sweeper-prop-${stamp}`,
        status: "PUBLISHED",
        price: 5000000n,
      }),
    });
    propertyId = property.id;

    console.log("✔ Fixtures initialized");

    // 2. Test deposit-expiry sweeper (O9 / Y6)
    console.log("\n[Test 1] Deposit deadline expiry on ACCEPTED offer (O9 / Y6)");
    const createdOffer = await offerService.createOffer(
      { id: buyer.id, emailVerified: true },
      { propertyId: property.id, amount: 4800000 }
    );
    const offerId = createdOffer.id;

    // Agent accepts offer -> creates payment and 72h deadline
    const acceptedOffer = await offerService.acceptOffer({ id: agent.id }, offerId);
    assert.equal(acceptedOffer.status, "ACCEPTED");

    // Force deadline to 1 hour in the past
    const past = new Date(Date.now() - 3600 * 1000);
    await prisma.payment.updateMany({
      where: { offerId },
      data: { deadlineAt: past },
    });
    await prisma.offer.update({
      where: { id: offerId },
      data: { expiresAt: past },
    });

    // Run sweeper
    const expiredAcceptedCount = await offerService.expireStaleAcceptedOffers();
    assert.ok(expiredAcceptedCount >= 1, "At least 1 accepted offer expired");

    const updatedOffer = await offerService.getOffer({ id: buyer.id }, offerId);
    assert.equal(updatedOffer.status, "EXPIRED", "Offer status must be EXPIRED");

    const updatedPayment = await prisma.payment.findFirst({ where: { offerId } });
    assert.equal(updatedPayment?.status, "EXPIRED", "Payment status must be EXPIRED");
    console.log("✔ ACCEPTED offer and Payment expired correctly on deadline pass");

    // 3. Test offer-expiry sweeper (O10: 7-day TTL on unanswered pending offers)
    console.log("\n[Test 2] 7-day TTL expiry on unanswered pending offer (O10)");
    const createdPendingOffer = await offerService.createOffer(
      { id: buyer.id, emailVerified: true },
      { propertyId: property.id, amount: 4700000 }
    );
    const pendingOfferId = createdPendingOffer.id;

    // Force expiresAt to 1 hour in the past
    await prisma.offer.update({
      where: { id: pendingOfferId },
      data: { expiresAt: past },
    });

    const expiredPendingCount = await offerService.expireStalePendingOffers();
    assert.ok(expiredPendingCount >= 1, "At least 1 pending offer expired");

    const updatedPendingOffer = await offerService.getOffer({ id: buyer.id }, pendingOfferId);
    assert.equal(updatedPendingOffer.status, "EXPIRED", "Pending offer status must be EXPIRED");
    console.log("✔ Pending offer expired correctly past 7-day TTL");

    // 4. Test checkout hold expiry (§6.1)
    console.log("\n[Test 3] Checkout hold natural release (§6.1)");
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        checkoutHoldExpiresAt: past,
        checkoutHoldUserId: buyer.id,
      },
    });

    const holdsCleared = await paymentService.clearExpiredCheckoutHolds();
    assert.ok(holdsCleared >= 1, "At least 1 expired hold cleared");

    const propAfterHoldClear = await prisma.property.findUnique({ where: { id: propertyId } });
    assert.equal(propAfterHoldClear?.checkoutHoldExpiresAt, null);
    assert.equal(propAfterHoldClear?.checkoutHoldUserId, null);
    console.log("✔ Expired checkout hold cleared automatically");

    // 5. Test hygiene sweepers (Idempotency and Sessions)
    console.log("\n[Test 4] Hygiene sweepers (Idempotency keys and Sessions)");
    const prunedKeys = await pruneExpiredIdempotencyKeys();
    assert.equal(typeof prunedKeys, "number");

    const prunedSessions = await identityService.pruneExpiredSessions();
    assert.equal(typeof prunedSessions, "number");
    console.log("✔ Hygiene sweepers executed successfully");

    console.log("\n===============================================================================");
    console.log("🎉 ALL BACKGROUND WORKER SWEEPER TESTS PASSED (100% GREEN)");
    console.log("===============================================================================\n");
  } finally {
    // Teardown in cascade order
    if (propertyId) {
      await prisma.payment.deleteMany({ where: { offer: { propertyId } } }).catch(() => {});
      await prisma.offerRevision.deleteMany({ where: { offer: { propertyId } } }).catch(() => {});
      await prisma.offer.deleteMany({ where: { propertyId } }).catch(() => {});
      await prisma.lead.deleteMany({ where: { propertyId } }).catch(() => {});
      await prisma.property.delete({ where: { id: propertyId } }).catch(() => {});
    }
    if (areaId) await prisma.area.delete({ where: { id: areaId } }).catch(() => {});
    if (userIds.length > 0) {
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
