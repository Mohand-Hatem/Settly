process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { uuidv7 } from "uuidv7";

console.log("===============================================================================");
console.log("Settly Backend: Self-Service Agent Application & KYC Verification Test Suite");
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

  const buyerEmail = `test_applicant_${Date.now()}@test.settly.estate`;
  const admin1Email = `test_admin1_${Date.now()}@test.settly.estate`;
  const admin2Email = `test_admin2_${Date.now()}@test.settly.estate`;
  const password = "ValidPassword123!";

  let buyerUserId = null;
  let admin1UserId = null;
  let admin2UserId = null;
  let applicationId = null;
  let secondApplicationId = null;
  let agentProfileId = null;
  let testPropertyId = null;

  try {
    // --------------------------------------------------------------------------
    // 1. Sign up normal Buyer
    // --------------------------------------------------------------------------
    console.log("Test 1: Sign up prospective applicant buyer via POST /api/auth/sign-up/email...");
    const buyerSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: buyerEmail, password, name: "Kareem Broker Candidate", phone: "+201001234567" }),
    });
    assert.equal(buyerSignUpRes.status, 200);
    const buyerCookie = extractCookie(buyerSignUpRes);
    const buyerData = await buyerSignUpRes.json();
    buyerUserId = buyerData.user.id;
    console.log("  ✅ Passed: Buyer registered with USER role.");

    // --------------------------------------------------------------------------
    // 2. Buyer submits Agent Application (Decisions #49, #55, #56)
    // --------------------------------------------------------------------------
    console.log("\nTest 2: Buyer submits Agent Application via POST /api/v1/me/agent-profile/apply...");
    const applyRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: buyerCookie,
      },
      body: JSON.stringify({
        nationalIdUrl: "https://storage.settly.estate/kyc/test-national-id.pdf",
        selfieUrl: "https://storage.settly.estate/kyc/test-live-selfie.jpg",
        proofType: "BROKER_LICENSE",
        proofDocumentUrl: "https://storage.settly.estate/kyc/broker-license.pdf",
        licenseNumber: "EGY-RE-2026-TEST-99",
        brokerageName: "Cairo Horizons Realty",
        bioEn: "Specialist in prime properties across New Cairo and Golden Square.",
      }),
    });
    assert.equal(applyRes.status, 201);
    const appData = await applyRes.json();
    applicationId = appData.id;
    assert.equal(appData.status, "PENDING");
    assert.equal(appData.licenseNumber, "EGY-RE-2026-TEST-99");
    assert.equal(appData.proofType, "BROKER_LICENSE");
    console.log("  ✅ Passed: Agent application submitted with status PENDING.");

    // --------------------------------------------------------------------------
    // 3. Buyer checks current application status (APP-03)
    // --------------------------------------------------------------------------
    console.log("\nTest 3: Buyer checks application status via GET /api/v1/me/agent-profile/application...");
    const statusRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile/application`, {
      headers: { Cookie: buyerCookie },
    });
    assert.equal(statusRes.status, 200);
    const statusData = await statusRes.json();
    assert.equal(statusData.id, applicationId);
    assert.equal(statusData.status, "PENDING");
    console.log("  ✅ Passed: Current application status retrieved.");

    // --------------------------------------------------------------------------
    // 4. Decision #74: One pending application uniqueness check
    // --------------------------------------------------------------------------
    console.log("\nTest 4: Buyer attempts to submit a second application while first is pending...");
    const duplicateApplyRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: buyerCookie,
      },
      body: JSON.stringify({
        nationalIdUrl: "https://storage.settly.estate/kyc/test-national-id-2.pdf",
        selfieUrl: "https://storage.settly.estate/kyc/test-live-selfie-2.jpg",
        proofType: "BROKERAGE_AUTHORIZATION",
        proofDocumentUrl: "https://storage.settly.estate/kyc/auth-doc.pdf",
        licenseNumber: "EGY-RE-2026-TEST-99",
      }),
    });
    assert.equal(duplicateApplyRes.status, 409);
    const duplicateErr = await duplicateApplyRes.json();
    assert.equal(duplicateErr.type, "/errors/pending-application-exists");
    console.log("  ✅ Passed: Duplicate application rejected with RFC 9457 409 Conflict (Decision #74).");

    // --------------------------------------------------------------------------
    // 5. Non-admin attempt to access Admin queues (403 Forbidden)
    // --------------------------------------------------------------------------
    console.log("\nTest 5: Buyer attempts to access admin agent application endpoints...");
    const unauthorizedListRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications`, {
      headers: { Cookie: buyerCookie },
    });
    assert.equal(unauthorizedListRes.status, 403);
    console.log("  ✅ Passed: Non-admin rejected with 403 Forbidden.");

    // --------------------------------------------------------------------------
    // 6. Register Admin 1
    // --------------------------------------------------------------------------
    console.log("\nTest 6: Register Admin 1 and elevate to ADMIN role...");
    const admin1SignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: admin1Email, password, name: "System Admin 1", phone: "+201001234568" }),
    });
    assert.equal(admin1SignUpRes.status, 200);
    const admin1Cookie = extractCookie(admin1SignUpRes);
    const admin1Data = await admin1SignUpRes.json();
    admin1UserId = admin1Data.user.id;

    await prisma.user.update({
      where: { id: admin1UserId },
      data: { role: "ADMIN" },
    });
    console.log("  ✅ Passed: Admin 1 created.");

    // --------------------------------------------------------------------------
    // 7. Admin 1 lists pending applications (ADM-04)
    // --------------------------------------------------------------------------
    console.log("\nTest 7: Admin 1 retrieves pending queue via GET /api/v1/admin/agent-applications?status=PENDING...");
    const adminQueueRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications?status=PENDING`, {
      headers: { Cookie: admin1Cookie },
    });
    assert.equal(adminQueueRes.status, 200);
    const queueData = await adminQueueRes.json();
    assert.ok(Array.isArray(queueData.items));
    const foundApp = queueData.items.find((item) => item.id === applicationId);
    assert.ok(foundApp, "Submitted application must appear in pending queue");
    console.log("  ✅ Passed: Application visible in admin review queue.");

    // --------------------------------------------------------------------------
    // 8. Admin 1 inspects application details (ADM-04)
    // --------------------------------------------------------------------------
    console.log("\nTest 8: Admin 1 inspects application details via GET /api/v1/admin/agent-applications/:id...");
    const appDetailRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications/${applicationId}`, {
      headers: { Cookie: admin1Cookie },
    });
    assert.equal(appDetailRes.status, 200);
    const detailData = await appDetailRes.json();
    assert.equal(detailData.id, applicationId);
    assert.ok(detailData.nationalIdUrl, "Detail must include National ID URL for side-by-side check");
    assert.ok(detailData.selfieUrl, "Detail must include live selfie URL for side-by-side check");
    console.log("  ✅ Passed: Full application detail inspection verified.");

    // --------------------------------------------------------------------------
    // 9. Conflict of Interest guard: Admin self-review ban (Decisions #67, #71)
    // --------------------------------------------------------------------------
    console.log("\nTest 9: Admin self-review conflict of interest guard (Decisions #67, #71)...");
    // Create an application where the applicant is admin1 themselves
    const adminSelfAppId = uuidv7();
    await prisma.agentApplication.create({
      data: {
        id: adminSelfAppId,
        userId: admin1UserId,
        nationalIdUrl: "https://storage.settly.estate/kyc/admin-id.pdf",
        selfieUrl: "https://storage.settly.estate/kyc/admin-selfie.jpg",
        proofType: "BROKER_LICENSE",
        proofDocumentUrl: "https://storage.settly.estate/kyc/admin-license.pdf",
        licenseNumber: "EGY-ADMIN-01",
        status: "PENDING",
      },
    });

    const conflictReviewRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications/${adminSelfAppId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: admin1Cookie,
      },
      body: JSON.stringify({
        decision: "APPROVED",
        notes: "Self-approval attempt",
      }),
    });
    assert.equal(conflictReviewRes.status, 403, "Self-review must be blocked with 403 Forbidden");
    console.log("  ✅ Passed: Conflict of interest self-review rejected with RFC 9457 403 Forbidden.");

    // Clean up admin self app
    await prisma.agentApplication.delete({ where: { id: adminSelfAppId } });

    // --------------------------------------------------------------------------
    // 10. Decision #57: Rejection requires a mandatory reason
    // --------------------------------------------------------------------------
    console.log("\nTest 10: Admin 1 attempts rejection without reason (Decision #57)...");
    const invalidRejectRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications/${applicationId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: admin1Cookie,
      },
      body: JSON.stringify({
        decision: "REJECTED",
      }),
    });
    assert.equal(invalidRejectRes.status, 422, "Rejection without reason must fail validation");
    console.log("  ✅ Passed: Rejection without reason rejected with 422 Validation Error.");

    // --------------------------------------------------------------------------
    // 11. Admin 1 rejects application with reason (Decision #57)
    // --------------------------------------------------------------------------
    console.log("\nTest 11: Admin 1 rejects application with mandatory reason...");
    const rejectRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications/${applicationId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: admin1Cookie,
      },
      body: JSON.stringify({
        decision: "REJECTED",
        rejectionReason: "National ID scan was unreadable. Please upload a high-resolution color scan.",
      }),
    });
    assert.equal(rejectRes.status, 200);
    const rejectedData = await rejectRes.json();
    assert.equal(rejectedData.status, "REJECTED");
    assert.ok(rejectedData.rejectionReason);

    // Verify AuditLog entry for rejection
    const rejectAudit = await prisma.auditLog.findFirst({
      where: {
        entityType: "AgentApplication",
        entityId: applicationId,
        action: "AGENT_APPLICATION_REJECTED",
      },
    });
    assert.ok(rejectAudit, "AuditLog must record AGENT_APPLICATION_REJECTED");
    console.log("  ✅ Passed: Application rejected, reason recorded, and AuditLog created.");

    // --------------------------------------------------------------------------
    // 12. Decisions #57, #74: Rejected applicant re-applies immediately
    // --------------------------------------------------------------------------
    console.log("\nTest 12: Rejected applicant re-applies immediately (Decisions #57, #74)...");
    const reapplyRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile/apply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: buyerCookie,
      },
      body: JSON.stringify({
        nationalIdUrl: "https://storage.settly.estate/kyc/test-national-id-hires.pdf",
        selfieUrl: "https://storage.settly.estate/kyc/test-live-selfie.jpg",
        proofType: "BROKER_LICENSE",
        proofDocumentUrl: "https://storage.settly.estate/kyc/broker-license.pdf",
        licenseNumber: "EGY-RE-2026-TEST-99",
        brokerageName: "Cairo Horizons Realty",
        bioEn: "Specialist in prime properties across New Cairo and Golden Square.",
      }),
    });
    assert.equal(reapplyRes.status, 201);
    const reapplyData = await reapplyRes.json();
    secondApplicationId = reapplyData.id;
    assert.notEqual(secondApplicationId, applicationId);
    assert.equal(reapplyData.status, "PENDING");
    console.log("  ✅ Passed: Immediate re-application succeeded with new PENDING application.");

    // --------------------------------------------------------------------------
    // 13. Register Admin 2 and approve application
    // --------------------------------------------------------------------------
    console.log("\nTest 13: Admin 2 approves application, elevating user to AGENT...");
    const admin2SignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: admin2Email, password, name: "System Admin 2", phone: "+201001234569" }),
    });
    assert.equal(admin2SignUpRes.status, 200);
    const admin2Cookie = extractCookie(admin2SignUpRes);
    const admin2Data = await admin2SignUpRes.json();
    admin2UserId = admin2Data.user.id;

    await prisma.user.update({
      where: { id: admin2UserId },
      data: { role: "ADMIN" },
    });

    const approveRes = await fetch(`${BASE_URL}/api/v1/admin/agent-applications/${secondApplicationId}/review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: admin2Cookie,
      },
      body: JSON.stringify({
        decision: "APPROVED",
        notes: "Identity documents verified and license active in Egyptian register.",
      }),
    });
    assert.equal(approveRes.status, 200);
    const approvedData = await approveRes.json();
    assert.equal(approvedData.status, "APPROVED");

    // Check applicant user role elevated to AGENT
    const elevatedUser = await prisma.user.findUnique({
      where: { id: buyerUserId },
      include: { agentProfile: true },
    });
    assert.equal(elevatedUser.role, "AGENT", "Applicant user role must be elevated to AGENT");
    assert.ok(elevatedUser.agentProfile, "AgentProfile must be created");
    assert.equal(elevatedUser.agentProfile.isVerified, true);
    assert.ok(elevatedUser.agentProfile.verifiedAt !== null);
    agentProfileId = elevatedUser.agentProfile.id;

    // Check AuditLog entry
    const approveAudit = await prisma.auditLog.findFirst({
      where: {
        entityType: "AgentApplication",
        entityId: secondApplicationId,
        action: "AGENT_APPLICATION_APPROVED",
      },
    });
    assert.ok(approveAudit, "AuditLog must record AGENT_APPLICATION_APPROVED");
    console.log("  ✅ Passed: Application approved, user elevated to AGENT, AgentProfile verified.");

    // --------------------------------------------------------------------------
    // 14. Revocation Cascade (Decisions #52, #58)
    // --------------------------------------------------------------------------
    console.log("\nTest 14: Revocation cascade suspends active listings (Decisions #52, #58)...");
    // Create an active PUBLISHED listing for this agent
    const area = await prisma.area.findFirst();
    testPropertyId = uuidv7();
    await prisma.property.create({
      data: {
        id: testPropertyId,
        agentId: buyerUserId,
        areaId: area.id,
        slug: `test-property-revocation-${Date.now()}`,
        titleEn: "Luxury Penthouse in New Cairo",
        descriptionEn: "High floor luxury penthouse overlooking Lake View.",
        propertyType: "PENTHOUSE",
        listingIntent: "SALE",
        price: 15000000,
        bedrooms: 4,
        bathrooms: 3,
        areaSqm: 320,
        latitude: 30.0123,
        longitude: 31.4567,
        status: "PUBLISHED",
      },
    });

    // Admin 2 revokes the agent
    const revokeRes = await fetch(`${BASE_URL}/api/v1/admin/agents/${agentProfileId}/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: admin2Cookie,
      },
      body: JSON.stringify({
        notes: "Disciplinary suspension following regulatory non-compliance.",
      }),
    });
    assert.equal(revokeRes.status, 200);
    const revokedProfile = await revokeRes.json();
    assert.equal(revokedProfile.isVerified, false);
    assert.equal(revokedProfile.verifiedAt, null);

    // Verify property transitioned to SUSPENDED per Decision #52, #58
    const propertyAfterRevoke = await prisma.property.findUnique({
      where: { id: testPropertyId },
    });
    assert.equal(propertyAfterRevoke.status, "SUSPENDED", "Live listing must be SUSPENDED upon agent revocation");

    // Verify AuditLog entry for revocation
    const revokeAudit = await prisma.auditLog.findFirst({
      where: {
        entityType: "AgentProfile",
        entityId: agentProfileId,
        action: "AGENT_REVOKED",
      },
    });
    assert.ok(revokeAudit, "AuditLog must record AGENT_REVOKED");
    console.log("  ✅ Passed: Agent revoked, active listings cascaded to SUSPENDED, AuditLog written.");

    // --------------------------------------------------------------------------
    // 15. UserDevice FCM token registration & deregistration
    // --------------------------------------------------------------------------
    console.log("\nTest 15: UserDevice FCM token registration & deregistration...");
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

    const deleteDeviceRes = await fetch(`${BASE_URL}/api/v1/me/devices/${testFcmToken}`, {
      method: "DELETE",
      headers: { Cookie: buyerCookie },
    });
    assert.equal(deleteDeviceRes.status, 204);
    console.log("  ✅ Passed: FCM Device tokens registered and deregistered cleanly.");

    console.log("\n===============================================================================");
    console.log("All Agent KYC Application & Verification Tests Passed Successfully! ✅");
    console.log("===============================================================================\n");
  } finally {
    console.log("Cleaning up test fixtures from database...");
    if (testPropertyId) {
      await prisma.property.deleteMany({ where: { id: testPropertyId } }).catch(() => {});
    }
    const userIds = [buyerUserId, admin1UserId, admin2UserId].filter(Boolean);
    for (const uid of userIds) {
      await prisma.agentApplication.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.userDevice.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.agentProfile.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.session.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.account.deleteMany({ where: { userId: uid } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: uid } }).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
    console.log("Test fixtures purged and server closed.");
  }
}

run().catch((err) => {
  console.error("Agent verification test suite failed with error:", err);
  process.exit(1);
});
