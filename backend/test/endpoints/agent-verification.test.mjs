process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";

console.log("===============================================================================");
console.log("Settly Backend: Agent Verification Lifecycle & UserDevice Test Suite");
console.log("===============================================================================\n");

const PORT = 4004;
const BASE_URL = `http://localhost:${PORT}`;

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie.split(";")[0] || "";
}

async function run() {
  await new Promise((resolve) => {
    server.listen(PORT, resolve);
  });
  console.log(`Test server running at ${BASE_URL}\n`);

  const agentEmail = `test_agent_verif_${Date.now()}@test.settly.estate`;
  const buyerEmail = `test_buyer_verif_${Date.now()}@test.settly.estate`;
  const adminEmail = `test_admin_verif_${Date.now()}@test.settly.estate`;
  const password = "ValidPassword123!";

  let agentUserId = null;
  let buyerUserId = null;
  let adminUserId = null;
  let agentProfileId = null;

  try {
    // --------------------------------------------------------------------------
    // 1. Sign up Agent candidate
    // --------------------------------------------------------------------------
    console.log("Test 1: Sign up prospective agent via POST /api/auth/sign-up/email...");
    const agentSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: agentEmail, password, name: "Prospective Agent", phone: "+201001234567" }),
    });
    assert.equal(agentSignUpRes.status, 200);
    const agentCookie = extractCookie(agentSignUpRes);
    const agentData = await agentSignUpRes.json();
    agentUserId = agentData.user.id;

    // Set role to AGENT in DB so they can submit profile
    await prisma.user.update({
      where: { id: agentUserId },
      data: { role: "AGENT" },
    });
    console.log("  ✅ Passed: Agent registered and elevated to AGENT role.");

    // --------------------------------------------------------------------------
    // 2. Submit AgentProfile (defaults to isVerified: false)
    // --------------------------------------------------------------------------
    console.log("\nTest 2: Agent submits profile via POST /api/v1/me/agent-profile...");
    const profileRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: agentCookie,
      },
      body: JSON.stringify({
        licenseNumber: "EGY-RE-2026-TEST-77",
        brokerageName: "Cairo Prestige Realty",
        bioEn: "Specialist in prime properties across New Cairo.",
      }),
    });
    assert.equal(profileRes.status, 200);
    const profileData = await profileRes.json();
    agentProfileId = profileData.id;
    assert.equal(profileData.isVerified, false, "New agent profile must start unverified");
    assert.equal(profileData.verifiedAt, null);
    console.log("  ✅ Passed: Agent profile created with isVerified: false.");

    // --------------------------------------------------------------------------
    // 3. Normal Buyer attempt to access Admin agent queue (403 Forbidden)
    // --------------------------------------------------------------------------
    console.log("\nTest 3: Normal buyer attempts to access GET /api/v1/admin/agents...");
    const buyerSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: buyerEmail, password, name: "Test Buyer", phone: "+201001234567" }),
    });
    assert.equal(buyerSignUpRes.status, 200);
    const buyerCookie = extractCookie(buyerSignUpRes);
    const buyerData = await buyerSignUpRes.json();
    buyerUserId = buyerData.user.id;

    const buyerAdminRes = await fetch(`${BASE_URL}/api/v1/admin/agents`, {
      headers: { Cookie: buyerCookie },
    });
    assert.equal(buyerAdminRes.status, 403);
    const buyerAdminErr = await buyerAdminRes.json();
    assert.equal(buyerAdminErr.type, "/errors/forbidden");
    console.log("  ✅ Passed: Non-admin buyer rejected with RFC 9457 403 Forbidden.");

    // --------------------------------------------------------------------------
    // 4. Create Admin User
    // --------------------------------------------------------------------------
    console.log("\nTest 4: Register admin and elevate to ADMIN role...");
    const adminSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: adminEmail, password, name: "System Admin", phone: "+201001234567" }),
    });
    assert.equal(adminSignUpRes.status, 200);
    const adminCookie = extractCookie(adminSignUpRes);
    const adminData = await adminSignUpRes.json();
    adminUserId = adminData.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: "ADMIN" },
    });
    console.log("  ✅ Passed: Admin user created.");

    // --------------------------------------------------------------------------
    // 5. Admin retrieves pending agents queue
    // --------------------------------------------------------------------------
    console.log("\nTest 5: Admin retrieves unverified queue via GET /api/v1/admin/agents?verified=false...");
    const adminQueueRes = await fetch(`${BASE_URL}/api/v1/admin/agents?verified=false`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminQueueRes.status, 200);
    const queueData = await adminQueueRes.json();
    assert.ok(Array.isArray(queueData.items));
    const found = queueData.items.find((item) => item.id === agentProfileId);
    assert.ok(found, "Pending agent profile must appear in admin queue");
    assert.equal(found.isVerified, false);
    console.log("  ✅ Passed: Pending agent visible in admin verification queue.");

    // --------------------------------------------------------------------------
    // 6. Admin approves agent verification
    // --------------------------------------------------------------------------
    console.log("\nTest 6: Admin approves agent via POST /api/v1/admin/agents/:id/verify...");
    const verifyRes = await fetch(`${BASE_URL}/api/v1/admin/agents/${agentProfileId}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        verified: true,
        notes: "Regulatory license EGY-RE-2026-TEST-77 confirmed valid.",
      }),
    });
    assert.equal(verifyRes.status, 200);
    const verifiedData = await verifyRes.json();
    assert.equal(verifiedData.isVerified, true);
    assert.ok(verifiedData.verifiedAt !== null);

    // Verify AuditLog entry was recorded (Decision #42)
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityType: "AgentProfile",
        entityId: agentProfileId,
        action: "AGENT_VERIFIED",
      },
    });
    assert.equal(auditLogs.length, 1, "Expected 1 immutable AuditLog entry for verification");
    assert.equal(auditLogs[0].actorType, "ADMIN");
    assert.equal(auditLogs[0].actorId, adminUserId);
    console.log("  ✅ Passed: Agent verified successfully and immutable AuditLog recorded.");

    // --------------------------------------------------------------------------
    // 7. Register FCM Device Token for Buyer
    // --------------------------------------------------------------------------
    console.log("\nTest 7: Buyer registers FCM device token via POST /api/v1/me/devices...");
    const testFcmToken = `fcm_test_${Date.now()}_abc123`;
    const deviceRes = await fetch(`${BASE_URL}/api/v1/me/devices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: buyerCookie,
      },
      body: JSON.stringify({
        token: testFcmToken,
        platform: "WEB",
      }),
    });
    assert.equal(deviceRes.status, 201);
    const deviceData = await deviceRes.json();
    assert.equal(deviceData.token, testFcmToken);
    assert.equal(deviceData.platform, "WEB");
    assert.equal(deviceData.userId, buyerUserId);
    console.log("  ✅ Passed: FCM device token registered.");

    // --------------------------------------------------------------------------
    // 8. Deregister FCM Device Token on logout
    // --------------------------------------------------------------------------
    console.log("\nTest 8: Buyer deregisters FCM device token via DELETE /api/v1/me/devices/:token...");
    const deleteDeviceRes = await fetch(`${BASE_URL}/api/v1/me/devices/${testFcmToken}`, {
      method: "DELETE",
      headers: { Cookie: buyerCookie },
    });
    assert.equal(deleteDeviceRes.status, 204);

    const remainingDevices = await prisma.userDevice.findMany({
      where: { fcmToken: testFcmToken },
    });
    assert.equal(remainingDevices.length, 0, "Device token should be completely removed");
    console.log("  ✅ Passed: Device token deregistered successfully.");

    console.log("\n===============================================================================");
    console.log("All Agent Verification & UserDevice Tests Passed Successfully! ✅");
    console.log("===============================================================================\n");
  } finally {
    console.log("Cleaning up test fixtures from Neon database...");
    const userIds = [agentUserId, buyerUserId, adminUserId].filter(Boolean);
    for (const uid of userIds) {
      await prisma.userDevice.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.agentProfile.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.session.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.account.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: uid } }).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
    console.log("Test fixtures cleanly purged and server closed.");
  }
}

run().catch((err) => {
  console.error("Agent verification test suite failed with error:", err);
  process.exit(1);
});
