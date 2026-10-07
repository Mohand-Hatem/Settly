process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { paymobAdapter } from "../../dist/modules/payments/index.js";
import { uuidv7 } from "uuidv7";

console.log("===============================================================================");
console.log("Settly Backend: Agent Subscription Engine & Listing Quota Waiting (Task A3)");
console.log("===============================================================================\n");

const PORT = 4019;
const BASE_URL = `http://localhost:${PORT}`;

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie.split(";")[0] || "";
}

function computePaymobHmac(obj, secret = "dummy_secret_for_ci") {
  // Ordered concatenation per PAYMENTS.md §5
  const values = [
    obj.amount_cents,
    obj.created_at,
    obj.currency,
    obj.error_occured,
    obj.has_parent_transaction,
    obj.id,
    obj.integration_id,
    obj.is_3d_secure,
    obj.is_auth,
    obj.is_capture,
    obj.is_refunded,
    obj.is_standalone_payment,
    obj.is_voided,
    obj.order?.id ?? obj.order_id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan ?? "",
    obj.source_data?.sub_type ?? "",
    obj.source_data?.type ?? "",
    obj.success,
  ];
  return crypto.createHmac("sha512", secret).update(values.join("")).digest("hex");
}

async function run() {
  await new Promise((resolve) => {
    server.listen(PORT, resolve);
  });
  console.log(`Test server running at ${BASE_URL}\n`);

  const agentEmail = `test_sub_agent_${Date.now()}@test.settly.estate`;
  const adminEmail = `test_sub_admin_${Date.now()}@test.settly.estate`;
  const password = "ValidPassword123!";

  let agentUserId = null;
  let adminUserId = null;
  let areaId = null;

  try {
    // Setup test area
    const area = await prisma.area.create({
      data: {
        id: uuidv7(),
        slug: `sub-test-area-${Date.now()}`,
        nameEn: "Subscription Test Area",
        nameAr: "منطقة تجربة الاشتراك",
        level: "DISTRICT",
      },
    });
    areaId = area.id;

    // 1. Sign up Agent
    const agentSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: agentEmail, password, name: "Sub Agent", phone: "+201009998877" }),
    });
    assert.equal(agentSignUpRes.status, 200);
    const agentCookie = extractCookie(agentSignUpRes);
    const agentData = await agentSignUpRes.json();
    agentUserId = agentData.user.id;

    // Elevate to AGENT and verify email
    await prisma.user.update({
      where: { id: agentUserId },
      data: { role: "AGENT", emailVerified: true },
    });

    // 2. Sign up Admin
    const adminSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: adminEmail, password, name: "Admin Mod", phone: "+201001112233" }),
    });
    assert.equal(adminSignUpRes.status, 200);
    const adminCookie = extractCookie(adminSignUpRes);
    const adminData = await adminSignUpRes.json();
    adminUserId = adminData.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: "ADMIN", emailVerified: true },
    });

    // --------------------------------------------------------------------------
    // Test 1: GET /api/v1/agent/subscription without auth -> 401
    // --------------------------------------------------------------------------
    console.log("Test 1: Anonymous access to /api/v1/agent/subscription -> 401");
    const anonRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`);
    assert.equal(anonRes.status, 401);
    console.log("  ✅ Passed: Anonymous access blocked with 401.\n");

    // --------------------------------------------------------------------------
    // Test 2: Unverified agent subscription defaults to Free
    // --------------------------------------------------------------------------
    console.log("Test 2: Agent subscription status defaults to Free with quota 2");
    const subStatusRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`, {
      headers: { Cookie: agentCookie },
    });
    assert.equal(subStatusRes.status, 200);
    const subStatus = await subStatusRes.json();
    assert.equal(subStatus.plan, "FREE");
    assert.equal(subStatus.quota.total, 2);
    assert.equal(subStatus.quota.remaining, 2);
    assert.equal(subStatus.isVerified, false);
    assert.equal(subStatus.canRenew, false);
    console.log("  ✅ Passed: Free tier reported correctly with quota 2.\n");

    // --------------------------------------------------------------------------
    // Test 3: Unverified agent blocked from subscribing to paid plans (#51, #93)
    // --------------------------------------------------------------------------
    console.log("Test 3: Unverified agent blocked from initiating paid checkout -> 403");
    const unverifiedCheckoutRes = await fetch(`${BASE_URL}/api/v1/agent/subscription/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: agentCookie },
      body: JSON.stringify({ plan: "PRO" }),
    });
    assert.equal(unverifiedCheckoutRes.status, 403);
    console.log("  ✅ Passed: Unverified agent rejected with 403.\n");

    // Verify agent profile
    await prisma.agentProfile.create({
      data: {
        id: uuidv7(),
        userId: agentUserId,
        licenseNumber: "LIC-12345",
        brokerageName: "Settly Premier Realty",
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    // --------------------------------------------------------------------------
    // Test 4: Verified agent initiates Pro subscription checkout (980 EGP / $20)
    // --------------------------------------------------------------------------
    console.log("Test 4: Verified agent initiates Pro checkout (980 EGP)");
    const proCheckoutRes = await fetch(`${BASE_URL}/api/v1/agent/subscription/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: agentCookie },
      body: JSON.stringify({ plan: "PRO" }),
    });
    assert.equal(proCheckoutRes.status, 200);
    const proCheckout = await proCheckoutRes.json();
    assert.equal(proCheckout.plan, "PRO");
    assert.equal(proCheckout.kind, "NEW");
    assert.equal(proCheckout.amountEgp, 980);
    assert.equal(proCheckout.amountUsd, 20);
    assert.ok(proCheckout.orderReference.startsWith("sub_"));
    assert.ok(proCheckout.checkoutUrl);
    console.log("  ✅ Passed: Pro checkout created (orderReference:", proCheckout.orderReference, ")\n");

    // --------------------------------------------------------------------------
    // Test 5: Paymob Webhook receives transaction for sub_ order -> Activates PRO
    // --------------------------------------------------------------------------
    console.log("Test 5: Paymob webhook settles sub_ payment");
    const paymentId = proCheckout.orderReference.replace("sub_", "");
    const providerOrderId = "pm_order_123456";
    const webhookPayload = {
      obj: {
        id: 99887766,
        amount_cents: 98000,
        currency: "EGP",
        success: true,
        pending: false,
        created_at: new Date().toISOString(),
        error_occured: false,
        has_parent_transaction: false,
        integration_id: 112233,
        is_3d_secure: true,
        is_auth: false,
        is_capture: true,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: {
          id: 554433,
          merchant_order_id: proCheckout.orderReference,
        },
        owner: 1,
        source_data: { pan: "0008", sub_type: "Visa", type: "card" },
      },
    };
    const signature = paymobAdapter.generateWebhookSignature(webhookPayload);

    const webhookRes = await fetch(`${BASE_URL}/api/v1/payments/webhook/paymob?hmac=${signature}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
    });
    assert.equal(webhookRes.status, 200);
    const webhookResult = await webhookRes.json();
    assert.equal(webhookResult.success, true);
    console.log("  ✅ Passed: Webhook successfully processed subscription.\n");

    // --------------------------------------------------------------------------
    // Test 6: Verify Agent Subscription status is now PRO with quota 4
    // --------------------------------------------------------------------------
    console.log("Test 6: Agent status is now PRO with monthly quota 4");
    const activeStatusRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`, {
      headers: { Cookie: agentCookie },
    });
    assert.equal(activeStatusRes.status, 200);
    const activeStatus = await activeStatusRes.json();
    assert.equal(activeStatus.plan, "PRO");
    assert.equal(activeStatus.quota.total, 4);
    assert.equal(activeStatus.quota.remaining, 4);
    assert.equal(activeStatus.receipts.length, 1);
    assert.equal(activeStatus.receipts[0].amountEgp, 980);
    assert.ok(activeStatus.receipts[0].receiptNumber);
    assert.equal(activeStatus.canRenew, false); // Not in last 7 days of 30-day period
    assert.equal(activeStatus.canUpgrade, true);
    console.log("  ✅ Passed: Plan is PRO, quota is 4, receipt recorded.\n");

    // --------------------------------------------------------------------------
    // Test 7: Upgrade to ENTERPRISE mid-period (2,449 EGP / $50)
    // --------------------------------------------------------------------------
    console.log("Test 7: Mid-period upgrade to ENTERPRISE (2,449 EGP)");
    const upgradeCheckoutRes = await fetch(`${BASE_URL}/api/v1/agent/subscription/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: agentCookie },
      body: JSON.stringify({ plan: "ENTERPRISE" }),
    });
    assert.equal(upgradeCheckoutRes.status, 200);
    const upgradeCheckout = await upgradeCheckoutRes.json();
    assert.equal(upgradeCheckout.plan, "ENTERPRISE");
    assert.equal(upgradeCheckout.kind, "UPGRADE");
    assert.equal(upgradeCheckout.amountEgp, 2449);
    assert.equal(upgradeCheckout.amountUsd, 50);

    // Simulate Enterprise Webhook
    const entPayload = {
      obj: {
        id: 99887767,
        amount_cents: 244900,
        currency: "EGP",
        success: true,
        pending: false,
        created_at: new Date().toISOString(),
        error_occured: false,
        has_parent_transaction: false,
        integration_id: 112233,
        is_3d_secure: true,
        is_auth: false,
        is_capture: true,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: {
          id: 554434,
          merchant_order_id: upgradeCheckout.orderReference,
        },
        owner: 1,
        source_data: { pan: "0008", sub_type: "Visa", type: "card" },
      },
    };
    const entSig = paymobAdapter.generateWebhookSignature(entPayload);
    const entWebhookRes = await fetch(`${BASE_URL}/api/v1/payments/webhook/paymob?hmac=${entSig}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entPayload),
    });
    assert.equal(entWebhookRes.status, 200);

    const entStatusRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`, {
      headers: { Cookie: agentCookie },
    });
    const entStatus = await entStatusRes.json();
    assert.equal(entStatus.plan, "ENTERPRISE");
    assert.equal(entStatus.quota.total, 8);
    assert.equal(entStatus.quota.remaining, 8);
    console.log("  ✅ Passed: Upgraded to ENTERPRISE, quota updated to 8.\n");

    // --------------------------------------------------------------------------
    // Test 8: Invariant I13 & Quota Exhaustion -> Approved, Waiting for Quota (#94)
    // --------------------------------------------------------------------------
    console.log("Test 8: Invariant I13 quota enforcement and waiting listings");
    // Create 8 published properties to exhaust Enterprise quota (8)
    const propertyIds = [];
    for (let i = 0; i < 8; i++) {
      const p = await prisma.property.create({
        data: {
          id: uuidv7(),
          agentId: agentUserId,
          areaId,
          slug: `prop-ent-${i}-${Date.now()}`,
          titleEn: `Enterprise Residence ${i}`,
          propertyType: "APARTMENT",
          listingIntent: "SALE",
          price: 500000000n,
          bedrooms: 3,
          bathrooms: 2,
          areaSqm: 150,
          status: "PUBLISHED",
          publishedAt: new Date(),
          latitude: 30.0444,
          longitude: 31.2357,
        },
      });
      propertyIds.push(p.id);
    }

    // Now verify quota is 0
    const exhaustedStatusRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`, {
      headers: { Cookie: agentCookie },
    });
    const exhaustedStatus = await exhaustedStatusRes.json();
    assert.equal(exhaustedStatus.quota.used, 8);
    assert.equal(exhaustedStatus.quota.remaining, 0);

    // Create 9th listing in PENDING_REVIEW
    const waitingProp = await prisma.property.create({
      data: {
        id: uuidv7(),
        agentId: agentUserId,
        areaId,
        slug: `prop-waiting-${Date.now()}`,
        titleEn: "Waiting Property",
        propertyType: "APARTMENT",
        listingIntent: "SALE",
        price: 450000000n,
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 120,
        status: "PENDING_REVIEW",
        publishedAt: null,
        latitude: 30.0444,
        longitude: 31.2357,
      },
    });

    // Admin approves 9th listing
    const approveRes = await fetch(`${BASE_URL}/api/v1/admin/properties/${waitingProp.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
    });
    assert.equal(approveRes.status, 200);
    const approveBody = await approveRes.json();

    // Must NOT be PUBLISHED; must stay PENDING_REVIEW as Approved, Waiting for Quota
    assert.equal(approveBody.status, "PENDING_REVIEW");
    assert.ok(approveBody.approvedWaitingForQuotaAt);
    console.log("  ✅ Passed: Admin approval kept listing in PENDING_REVIEW with approvedWaitingForQuotaAt.\n");

    // Verify waiting count on agent subscription status
    const statusWithWaitingRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`, {
      headers: { Cookie: agentCookie },
    });
    const statusWithWaiting = await statusWithWaitingRes.json();
    assert.equal(statusWithWaiting.quota.waitingCount, 1);
    console.log("  ✅ Passed: Waiting count reported as 1 on agent subscription dashboard.\n");

    // --------------------------------------------------------------------------
    // Test 9: Cancellation without refund (#91)
    // --------------------------------------------------------------------------
    console.log("Test 9: Agent cancels subscription (runs to period end without refund)");
    const cancelRes = await fetch(`${BASE_URL}/api/v1/agent/subscription/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: agentCookie },
    });
    assert.equal(cancelRes.status, 200);
    const cancelBody = await cancelRes.json();
    assert.equal(cancelBody.success, true);
    assert.ok(cancelBody.cancelledAt);

    const postCancelStatusRes = await fetch(`${BASE_URL}/api/v1/agent/subscription`, {
      headers: { Cookie: agentCookie },
    });
    const postCancelStatus = await postCancelStatusRes.json();
    assert.equal(postCancelStatus.plan, "ENTERPRISE"); // Still active until period ends
    assert.ok(postCancelStatus.cancelledAt);
    console.log("  ✅ Passed: Subscription marked cancelled; paid period remains active.\n");

    console.log("===============================================================================");
    console.log("🎉 ALL AGENT SUBSCRIPTION & LISTING QUOTA TESTS PASSED (100% GREEN)");
    console.log("===============================================================================\n");
  } finally {
    // Teardown test data
    try {
      if (agentUserId) {
        await prisma.property.deleteMany({ where: { agentId: agentUserId } });
        await prisma.subscriptionPeriod.deleteMany({
          where: { subscription: { agentId: agentUserId } },
        });
        await prisma.agentSubscription.deleteMany({ where: { agentId: agentUserId } });
        await prisma.subscriptionPaymentAttempt.deleteMany({
          where: { subscriptionPayment: { agentId: agentUserId } },
        });
        await prisma.subscriptionPayment.deleteMany({ where: { agentId: agentUserId } });
        await prisma.agentProfile.deleteMany({ where: { userId: agentUserId } });
        await prisma.user.deleteMany({ where: { id: agentUserId } });
      }
      if (adminUserId) {
        await prisma.user.deleteMany({ where: { id: adminUserId } });
      }
      if (areaId) {
        await prisma.area.deleteMany({ where: { id: areaId } });
      }
    } catch (cleanupErr) {
      console.warn("Cleanup error (ignorable):", cleanupErr.message);
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
