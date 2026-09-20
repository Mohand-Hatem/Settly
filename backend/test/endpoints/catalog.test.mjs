process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { buildAreaData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: Catalog Lifecycle & Two-Tier Moderation Integration Suite");
console.log("===============================================================================\n");

const PORT = 4005;
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

  const timestamp = Date.now();
  const agentEmail = `agent_cat_${timestamp}@test.settly.estate`;
  const adminEmail = `admin_cat_${timestamp}@test.settly.estate`;
  const password = "ValidPassword123!";

  let agentUserId = null;
  let adminUserId = null;
  let agentProfileId = null;
  let testAreaId = null;
  let testPropertyId = null;
  let freshDraftPropertyId = null;

  try {
    // --------------------------------------------------------------------------
    // Setup: Create test Area in DB
    // --------------------------------------------------------------------------
    console.log("Setup: Seeding test area in database...");
    const areaData = buildAreaData({ nameEn: "Golden Square", nameAr: "المربع الذهبي" });
    testAreaId = areaData.id;
    await prisma.area.create({ data: areaData });
    console.log(`  ✅ Test area created with ID: ${testAreaId}`);

    // --------------------------------------------------------------------------
    // Setup: Register Agent and Admin
    // --------------------------------------------------------------------------
    console.log("Setup: Registering agent and admin users...");
    const agentSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: agentEmail, password, name: "Listing Agent", phone: "+201001234567" }),
    });
    assert.equal(agentSignUpRes.status, 200);
    const agentCookie = extractCookie(agentSignUpRes);
    const agentJson = await agentSignUpRes.json();
    agentUserId = agentJson.user.id;

    await prisma.user.update({
      where: { id: agentUserId },
      data: { role: "AGENT", emailVerified: true },
    });

    const adminSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: adminEmail, password, name: "Catalog Admin", phone: "+201001234567" }),
    });
    assert.equal(adminSignUpRes.status, 200);
    const adminCookie = extractCookie(adminSignUpRes);
    const adminJson = await adminSignUpRes.json();
    adminUserId = adminJson.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: "ADMIN", emailVerified: true },
    });
    console.log("  ✅ Users registered and elevated to AGENT and ADMIN roles.\n");

    // --------------------------------------------------------------------------
    // Test 1: Agent creates DRAFT property (P1)
    // --------------------------------------------------------------------------
    console.log("Test 1: Agent creates DRAFT property via POST /api/v1/properties...");
    const createPropRes = await fetch(`${BASE_URL}/api/v1/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: agentCookie,
      },
      body: JSON.stringify({
        titleEn: "Signature Lake View Villa",
        titleAr: "فيلا مميزة بإطلالة على البحيرة",
        descriptionEn: "Exclusive lakeside residence with private garden and pool.",
        descriptionAr: "فيلا حصرية على البحيرة مع حديقة خاصة وحمام سباحة.",
        propertyType: "VILLA",
        listingIntent: "SALE",
        price: "1850000000", // 18,500,000 EGP in piastres
        bedrooms: 5,
        bathrooms: 6,
        areaSqm: 520,
        latitude: 30.0244,
        longitude: 31.4921,
        areaId: testAreaId,
      }),
    });
    assert.equal(createPropRes.status, 201, "Expected 201 Created");
    const propData = await createPropRes.json();
    testPropertyId = propData.id;
    assert.equal(propData.status, "DRAFT");
    assert.equal(propData.agentId, agentUserId);
    assert.equal(propData.price, "1850000000");
    assert.ok(propData.slug.startsWith("signature-lake-view-villa"));
    console.log(`  ✅ Passed: Property created in DRAFT state with slug '${propData.slug}'.\n`);

    // --------------------------------------------------------------------------
    // Test 2: Submit with unverified agent fails guard (403)
    // --------------------------------------------------------------------------
    console.log("Test 2: Agent attempts to submit listing before profile verification (403)...");
    const unverifiedSubmitRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}/submit`,
      {
        method: "POST",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(unverifiedSubmitRes.status, 403);
    const unverifiedJson = await unverifiedSubmitRes.json();
    assert.equal(unverifiedJson.type, "/errors/agent-not-verified");
    console.log("  ✅ Passed: Blocked with RFC 9457 /errors/agent-not-verified.\n");

    // --------------------------------------------------------------------------
    // Test 3: Agent submits profile and Admin verifies agent
    // --------------------------------------------------------------------------
    console.log("Test 3: Agent submits profile and Admin verifies agent profile...");
    const profileRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: agentCookie,
      },
      body: JSON.stringify({
        licenseNumber: `EGY-LIC-${timestamp}`,
        brokerageName: "Cairo Sotheby's International",
        bioEn: "Specialist in luxury residential properties.",
      }),
    });
    assert.equal(profileRes.status, 200);
    const profileData = await profileRes.json();
    agentProfileId = profileData.id;

    const verifyRes = await fetch(
      `${BASE_URL}/api/v1/admin/agents/${agentProfileId}/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ verified: true, notes: "Credentials checked" }),
      }
    );
    assert.equal(verifyRes.status, 200);
    console.log("  ✅ Passed: Agent successfully verified by admin.\n");

    // --------------------------------------------------------------------------
    // Test 4: Verified agent attempts to submit DRAFT with <3 images (422)
    // --------------------------------------------------------------------------
    console.log("Test 4: Verified agent attempts to submit DRAFT with 0 images (insufficient-images)...");
    const submitFailRes = await fetch(`${BASE_URL}/api/v1/properties/${testPropertyId}/submit`, {
      method: "POST",
      headers: { Cookie: agentCookie },
    });
    assert.equal(submitFailRes.status, 422, "Expected 422 Unprocessable Entity");
    const submitFailJson = await submitFailRes.json();
    assert.equal(submitFailJson.type, "/errors/insufficient-images");
    console.log("  ✅ Passed: Rejected with RFC 9457 /errors/insufficient-images.\n");

    // --------------------------------------------------------------------------
    // Test 5: Authorize direct image upload (STORAGE.md)
    // --------------------------------------------------------------------------
    console.log("Test 5: Authorize direct upload via POST /api/v1/uploads/authorize...");
    const authUploadRes = await fetch(`${BASE_URL}/api/v1/uploads/authorize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: agentCookie,
      },
      body: JSON.stringify({
        kind: "property_image",
        propertyId: testPropertyId,
        contentType: "image/jpeg",
        byteSize: 1024 * 500,
        filename: "villa-exterior.jpg",
      }),
    });
    assert.equal(authUploadRes.status, 200);
    const authUploadData = await authUploadRes.json();
    assert.equal(authUploadData.provider, "cloudinary");
    assert.ok(typeof authUploadData.uploadUrl === "string");
    assert.ok(authUploadData.params.signature, "Expected HMAC signature");
    assert.ok(authUploadData.params.api_key);
    console.log("  ✅ Passed: Signed Cloudinary direct upload instructions returned.\n");

    // --------------------------------------------------------------------------
    // Test 6: Complete 3 image uploads
    // --------------------------------------------------------------------------
    console.log("Test 6: Finalize 3 uploads via POST /api/v1/uploads/:assetId/complete...");
    for (let i = 1; i <= 3; i++) {
      const compRes = await fetch(
        `${BASE_URL}/api/v1/uploads/${authUploadData.assetId}/complete?propertyId=${testPropertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: agentCookie,
          },
          body: JSON.stringify({
            providerRef: `cloudinary_ref_${i}`,
            cloudinaryPublicId: `settly/properties/test-${i}`,
            url: `https://res.cloudinary.com/dmzcnnxzp/image/upload/v1/settly/properties/test-${i}.jpg`,
            captionEn: `Photo ${i}`,
            isCover: i === 1,
          }),
        }
      );
      assert.equal(compRes.status, 200);
    }
    console.log("  ✅ Passed: 3 PropertyImage records attached to listing.\n");

    // --------------------------------------------------------------------------
    // Test 7: P2 — Submit for review succeeds
    // --------------------------------------------------------------------------
    console.log("Test 7: P2 — Submit listing for review via POST /api/v1/properties/:id/submit...");
    const submitSuccessRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}/submit`,
      {
        method: "POST",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(submitSuccessRes.status, 200);
    const submittedData = await submitSuccessRes.json();
    assert.equal(submittedData.status, "PENDING_REVIEW");
    console.log("  ✅ Passed: Listing successfully entered PENDING_REVIEW state.\n");

    // --------------------------------------------------------------------------
    // Test 8: P4 — Admin rejects listing with reason
    // --------------------------------------------------------------------------
    console.log("Test 8: P4 — Admin rejects listing via POST /api/v1/admin/properties/:id/reject...");
    const rejectRes = await fetch(
      `${BASE_URL}/api/v1/admin/properties/${testPropertyId}/reject`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
        body: JSON.stringify({ reason: "Exterior photos must be re-taken in daylight." }),
      }
    );
    assert.equal(rejectRes.status, 200);
    const rejectedData = await rejectRes.json();
    assert.equal(rejectedData.status, "REJECTED");
    console.log("  ✅ Passed: Listing transitioned to REJECTED with reason recorded.\n");

    // --------------------------------------------------------------------------
    // Test 9: P5 — Agent resubmits listing
    // --------------------------------------------------------------------------
    console.log("Test 9: P5 — Agent resubmits listing via POST /api/v1/properties/:id/resubmit...");
    const resubmitRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}/resubmit`,
      {
        method: "POST",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(resubmitRes.status, 200);
    const resubmittedData = await resubmitRes.json();
    assert.equal(resubmittedData.status, "PENDING_REVIEW");
    console.log("  ✅ Passed: Listing resubmitted to PENDING_REVIEW queue.\n");

    // --------------------------------------------------------------------------
    // Test 10: P3 — Admin approves listing
    // --------------------------------------------------------------------------
    console.log("Test 10: P3 — Admin approves listing via POST /api/v1/admin/properties/:id/approve...");
    const approveRes = await fetch(
      `${BASE_URL}/api/v1/admin/properties/${testPropertyId}/approve`,
      {
        method: "POST",
        headers: { Cookie: adminCookie },
      }
    );
    assert.equal(approveRes.status, 200);
    const approvedData = await approveRes.json();
    assert.equal(approvedData.status, "PUBLISHED");
    assert.ok(approvedData.publishedAt, "publishedAt must be set on publication");
    console.log("  ✅ Passed: Listing is PUBLISHED with publishedAt timestamp.\n");

    // --------------------------------------------------------------------------
    // Test 11: P6 Two-Tier Moderation — Structural edit demotes to PENDING_REVIEW
    // --------------------------------------------------------------------------
    console.log("Test 11: P6 Two-Tier — Structural edit (propertyType) demotes PUBLISHED listing to PENDING_REVIEW...");
    const structuralEditRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: agentCookie,
        },
        body: JSON.stringify({ propertyType: "TOWNHOUSE" }),
      }
    );
    assert.equal(structuralEditRes.status, 200);
    const structuralEditData = await structuralEditRes.json();
    assert.equal(structuralEditData.propertyType, "TOWNHOUSE");
    assert.equal(
      structuralEditData.status,
      "PENDING_REVIEW",
      "Structural change must demote PUBLISHED listing to PENDING_REVIEW"
    );
    console.log("  ✅ Passed: Structural edit automatically demoted listing to PENDING_REVIEW.\n");

    // Re-approve so listing is PUBLISHED again
    await fetch(`${BASE_URL}/api/v1/admin/properties/${testPropertyId}/approve`, {
      method: "POST",
      headers: { Cookie: adminCookie },
    });

    // --------------------------------------------------------------------------
    // Test 12: P6 Two-Tier Moderation — Content edit (price) STAYS PUBLISHED & records history
    // --------------------------------------------------------------------------
    console.log("Test 12: P6 Two-Tier — Content edit (price) stays PUBLISHED and appends PropertyPriceHistory...");
    const contentEditRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: agentCookie,
        },
        body: JSON.stringify({ price: "2100000000" }), // 21,000,000 EGP
      }
    );
    assert.equal(contentEditRes.status, 200);
    const contentEditData = await contentEditRes.json();
    assert.equal(contentEditData.price, "2100000000");
    assert.equal(contentEditData.status, "PUBLISHED", "Content change must remain live");

    // Verify price history row exists
    const historyCount = await prisma.propertyPriceHistory.count({
      where: { propertyId: testPropertyId },
    });
    assert.ok(historyCount >= 1, "Expected PropertyPriceHistory row to be created");
    console.log("  ✅ Passed: Price edit stayed live and created PropertyPriceHistory row.\n");

    // --------------------------------------------------------------------------
    // Test 13: P7 — Archive listing
    // --------------------------------------------------------------------------
    console.log("Test 13: P7 — Agent archives listing via POST /api/v1/properties/:id/archive...");
    const archiveRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}/archive`,
      {
        method: "POST",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(archiveRes.status, 200);
    const archivedData = await archiveRes.json();
    assert.equal(archivedData.status, "ARCHIVED");
    console.log("  ✅ Passed: Property status transitioned to ARCHIVED.\n");

    // --------------------------------------------------------------------------
    // Test 14: P14 — Relist back to DRAFT
    // --------------------------------------------------------------------------
    console.log("Test 14: P14 — Relist archived property back to DRAFT...");
    const relistRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}/relist`,
      {
        method: "POST",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(relistRes.status, 200);
    const relistedData = await relistRes.json();
    assert.equal(relistedData.status, "DRAFT");
    console.log("  ✅ Passed: Archived property relisted back to DRAFT.\n");

    // --------------------------------------------------------------------------
    // Test 15: Decision #42 — Hard delete rejected on once-published property (409)
    // --------------------------------------------------------------------------
    console.log("Test 15: Decision #42 — Attempt to hard-delete once-published property fails with 409...");
    const deletePublishedRes = await fetch(
      `${BASE_URL}/api/v1/properties/${testPropertyId}`,
      {
        method: "DELETE",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(deletePublishedRes.status, 409);
    const deletePublishedErr = await deletePublishedRes.json();
    assert.equal(deletePublishedErr.type, "/errors/deletion-forbidden");
    console.log("  ✅ Passed: Hard delete prevented with RFC 9457 /errors/deletion-forbidden.\n");

    // --------------------------------------------------------------------------
    // Test 16: Decision #42 — Hard delete succeeds on never-published DRAFT
    // --------------------------------------------------------------------------
    console.log("Test 16: Create fresh DRAFT that never leaves DRAFT, and hard-delete it (204)...");
    const freshDraftRes = await fetch(`${BASE_URL}/api/v1/properties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: agentCookie,
      },
      body: JSON.stringify({
        titleEn: "Draft To Delete",
        descriptionEn: "Test listing that will be deleted before publication.",
        propertyType: "APARTMENT",
        listingIntent: "RENT",
        price: "4500000",
        bedrooms: 2,
        bathrooms: 2,
        areaSqm: 120,
        latitude: 30.01,
        longitude: 31.45,
        areaId: testAreaId,
      }),
    });
    assert.equal(freshDraftRes.status, 201);
    const freshDraftData = await freshDraftRes.json();
    freshDraftPropertyId = freshDraftData.id;

    const deleteDraftRes = await fetch(
      `${BASE_URL}/api/v1/properties/${freshDraftPropertyId}`,
      {
        method: "DELETE",
        headers: { Cookie: agentCookie },
      }
    );
    assert.equal(deleteDraftRes.status, 204);
    freshDraftPropertyId = null; // Already deleted
    console.log("  ✅ Passed: Never-published DRAFT successfully hard-deleted.\n");

    console.log("===============================================================================");
    console.log("Catalog Lifecycle Test Suite: ALL 16 SCENARIOS PASSED ✅");
    console.log("===============================================================================\n");
  } finally {
    // Teardown DB records (excluding append-only AuditLog)
    console.log("Tearing down test records...");
    try {
      if (freshDraftPropertyId) {
        await prisma.property.deleteMany({ where: { id: freshDraftPropertyId } });
      }
      if (testPropertyId) {
        await prisma.propertyPriceHistory.deleteMany({ where: { propertyId: testPropertyId } });
        await prisma.propertyImage.deleteMany({ where: { propertyId: testPropertyId } });
        await prisma.propertyAmenity.deleteMany({ where: { propertyId: testPropertyId } });
        await prisma.property.deleteMany({ where: { id: testPropertyId } });
      }
      if (agentProfileId) {
        await prisma.agentProfile.deleteMany({ where: { id: agentProfileId } });
      }
      if (testAreaId) {
        await prisma.area.deleteMany({ where: { id: testAreaId } });
      }
      if (agentUserId) {
        await prisma.session.deleteMany({ where: { userId: agentUserId } });
        await prisma.account.deleteMany({ where: { userId: agentUserId } });
        await prisma.user.deleteMany({ where: { id: agentUserId } });
      }
      if (adminUserId) {
        await prisma.session.deleteMany({ where: { userId: adminUserId } });
        await prisma.account.deleteMany({ where: { userId: adminUserId } });
        await prisma.user.deleteMany({ where: { id: adminUserId } });
      }
      console.log("Teardown completed cleanly.");
    } catch (cleanupErr) {
      console.error("Cleanup error:", cleanupErr);
    }

    server.close();
  }
}

run().catch((err) => {
  console.error("Fatal error during Catalog test run:", err);
  process.exit(1);
});
