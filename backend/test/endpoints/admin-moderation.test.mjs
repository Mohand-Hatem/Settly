process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";

console.log("===============================================================================");
console.log("Settly Backend: Admin Moderation & Operational Stats (ADM-01, ADM-02) Test Suite");
console.log("===============================================================================\n");

const PORT = 4017;
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

  const buyerEmail = `test_buyer_admin_${Date.now()}@test.settly.estate`;
  const adminEmail = `test_admin_mod_${Date.now()}@test.settly.estate`;
  const password = "ValidPassword123!";

  let buyerUserId = null;
  let adminUserId = null;

  try {
    // 1. Create a regular buyer
    const buyerSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: buyerEmail, password, name: "Normal Buyer", phone: "+201009876543" }),
    });
    assert.equal(buyerSignUpRes.status, 200);
    const buyerCookie = extractCookie(buyerSignUpRes);
    const buyerData = await buyerSignUpRes.json();
    buyerUserId = buyerData.user.id;

    // 2. Create an admin user
    const adminSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: adminEmail, password, name: "System Admin", phone: "+201001112233" }),
    });
    assert.equal(adminSignUpRes.status, 200);
    const adminCookie = extractCookie(adminSignUpRes);
    const adminData = await adminSignUpRes.json();
    adminUserId = adminData.user.id;

    // Elevate admin
    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: "ADMIN" },
    });

    // --------------------------------------------------------------------------
    // Test 1: Anonymous access to /api/v1/admin/stats returns 401
    // --------------------------------------------------------------------------
    console.log("Test 1: GET /api/v1/admin/stats without auth -> 401");
    const anonStatsRes = await fetch(`${BASE_URL}/api/v1/admin/stats`);
    assert.equal(anonStatsRes.status, 401);
    console.log("  ✅ Passed: Anonymous access blocked with 401.");

    // --------------------------------------------------------------------------
    // Test 2: Non-admin user access to /api/v1/admin/stats returns 403
    // --------------------------------------------------------------------------
    console.log("\nTest 2: GET /api/v1/admin/stats with USER role -> 403");
    const userStatsRes = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
      headers: { Cookie: buyerCookie },
    });
    assert.equal(userStatsRes.status, 403);
    console.log("  ✅ Passed: Non-admin role blocked with 403.");

    // --------------------------------------------------------------------------
    // Test 3: Admin access to /api/v1/admin/stats returns 200 with schema
    // --------------------------------------------------------------------------
    console.log("\nTest 3: GET /api/v1/admin/stats with ADMIN role -> 200");
    const adminStatsRes = await fetch(`${BASE_URL}/api/v1/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminStatsRes.status, 200);
    const stats = await adminStatsRes.json();
    assert.equal(typeof stats.pendingListings, "number");
    assert.equal(typeof stats.pendingAgentApplications, "number");
    assert.equal(typeof stats.salesNearDeadline, "number");
    assert.equal(typeof stats.failedRefundAlerts, "number");
    console.log("  ✅ Passed: Stats returned operational metrics:", stats);

    // --------------------------------------------------------------------------
    // Test 4: Anonymous access to /api/v1/admin/properties returns 401
    // --------------------------------------------------------------------------
    console.log("\nTest 4: GET /api/v1/admin/properties without auth -> 401");
    const anonPropsRes = await fetch(`${BASE_URL}/api/v1/admin/properties`);
    assert.equal(anonPropsRes.status, 401);
    console.log("  ✅ Passed: Anonymous access blocked with 401.");

    // --------------------------------------------------------------------------
    // Test 5: Admin access to /api/v1/admin/properties returns 200 with queue
    // --------------------------------------------------------------------------
    console.log("\nTest 5: GET /api/v1/admin/properties with ADMIN role -> 200");
    const adminPropsRes = await fetch(`${BASE_URL}/api/v1/admin/properties?status=PENDING_REVIEW`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(adminPropsRes.status, 200);
    const props = await adminPropsRes.json();
    assert.ok(Array.isArray(props.items));
    console.log(`  ✅ Passed: Admin moderation queue returned ${props.items.length} items (totalCount: ${props.totalCount ?? props.items.length}).`);

    // --------------------------------------------------------------------------
    // Test 6: Status filtering on /api/v1/admin/properties
    // --------------------------------------------------------------------------
    console.log("\nTest 6: GET /api/v1/admin/properties?status=PUBLISHED -> 200");
    const publishedPropsRes = await fetch(`${BASE_URL}/api/v1/admin/properties?status=PUBLISHED`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(publishedPropsRes.status, 200);
    const pubProps = await publishedPropsRes.json();
    assert.ok(Array.isArray(pubProps.items));
    console.log(`  ✅ Passed: Published listings returned ${pubProps.items.length} items.`);

    console.log("\n===============================================================================");
    console.log("All Admin Moderation & Operational Stats tests passed ✔");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup users
    if (buyerUserId) {
      await prisma.user.delete({ where: { id: buyerUserId } }).catch(() => {});
    }
    if (adminUserId) {
      await prisma.user.delete({ where: { id: adminUserId } }).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
