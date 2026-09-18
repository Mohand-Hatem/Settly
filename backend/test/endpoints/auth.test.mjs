process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";

console.log("===============================================================================");
console.log("Settly Backend: Better Auth, Sessions & RBAC Verification Suite");
console.log("===============================================================================\n");

const PORT = 4003;
const BASE_URL = `http://localhost:${PORT}`;

function extractCookie(res) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return "";
  // Return the first cookie name=value
  return setCookie.split(";")[0] || "";
}

async function run() {
  await new Promise((resolve) => {
    server.listen(PORT, resolve);
  });
  console.log(`Test server running at ${BASE_URL}\n`);

  const buyerEmail = `test_buyer_${Date.now()}@test.settly.estate`;
  const agentEmail = `test_agent_${Date.now()}@test.settly.estate`;
  const password = "ValidPassword123!";

  let buyerUserId = null;
  let agentUserId = null;

  try {
    // --------------------------------------------------------------------------
    // 1. Sign Up New Buyer
    // --------------------------------------------------------------------------
    console.log("Test 1: Sign up new buyer via POST /api/auth/sign-up/email...");
    const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        email: buyerEmail,
        password,
        name: "Test Buyer",
        phone: "010 0123 4567",
      }),
    });

    if (!signUpRes.ok) {
      const errText = await signUpRes.text();
      console.error("Sign up error response:", errText);
    }
    assert.equal(signUpRes.status, 200, `Sign up failed: ${signUpRes.statusText}`);
    const buyerCookie = extractCookie(signUpRes);
    assert.ok(buyerCookie.length > 0, "Expected session cookie in set-cookie header");

    const signUpData = await signUpRes.json();
    buyerUserId = signUpData.user.id;
    assert.ok(buyerUserId, "Expected user id in sign-up response");
    assert.equal(signUpData.user.email, buyerEmail);
    assert.equal(signUpData.user.role, "USER");
    const createdBuyer = await prisma.user.findUnique({ where: { id: buyerUserId } });
    assert.equal(createdBuyer.phone, "+201001234567", "Egyptian local number stored as E.164 (#60)");
    console.log(`  ✅ Passed: Buyer created with ID '${buyerUserId}', session cookie issued.\n`);

    // --------------------------------------------------------------------------
    // 2. Fetch User Profile (GET /api/v1/me)
    // --------------------------------------------------------------------------
    console.log("Test 2: GET /api/v1/me with active session cookie...");
    const meRes = await fetch(`${BASE_URL}/api/v1/me`, {
      headers: {
        Cookie: buyerCookie,
      },
    });

    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.id, buyerUserId);
    assert.equal(meData.email, buyerEmail);
    assert.equal(meData.role, "USER");
    assert.equal(meData.emailVerified, false);
    assert.equal(meData.preferredLocale, "en");
    console.log("  ✅ Passed: Profile successfully retrieved via session cookie.\n");

    // --------------------------------------------------------------------------
    // 3. Unauthenticated Access (RFC 9457 401)
    // --------------------------------------------------------------------------
    console.log("Test 3: GET /api/v1/me without session cookie returns RFC 9457 401...");
    const unauthRes = await fetch(`${BASE_URL}/api/v1/me`);
    assert.equal(unauthRes.status, 401);
    assert.ok(
      unauthRes.headers.get("content-type")?.includes("application/problem+json"),
      "Expected application/problem+json"
    );
    const unauthData = await unauthRes.json();
    assert.equal(unauthData.type, "/errors/unauthenticated");
    assert.equal(unauthData.status, 401);
    assert.ok(unauthData.requestId, "Expected correlation requestId");
    console.log("  ✅ Passed: Rejected with RFC 9457 /errors/unauthenticated.\n");

    // --------------------------------------------------------------------------
    // 4. Update Profile (PATCH /api/v1/me)
    // --------------------------------------------------------------------------
    console.log("Test 4: PATCH /api/v1/me updates display name and preferredLocale...");
    const updateRes = await fetch(`${BASE_URL}/api/v1/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: buyerCookie,
      },
      body: JSON.stringify({
        name: "Tarek Mansour Updated",
        preferredLocale: "ar",
      }),
    });

    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.name, "Tarek Mansour Updated");
    assert.equal(updateData.preferredLocale, "ar");
    console.log("  ✅ Passed: Profile updated to bilingual locale preference 'ar'.\n");

    // --------------------------------------------------------------------------
    // 5. Coarse Role Guard: USER attempting AGENT-only endpoint
    // --------------------------------------------------------------------------
    console.log("Test 5: USER attempting to access GET /api/v1/me/agent-profile returns 403...");
    const forbiddenRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile`, {
      headers: {
        Cookie: buyerCookie,
      },
    });

    assert.equal(forbiddenRes.status, 403);
    const forbiddenData = await forbiddenRes.json();
    assert.equal(forbiddenData.type, "/errors/forbidden");
    assert.equal(forbiddenData.status, 403);
    assert.ok(forbiddenData.detail.includes("AGENT"));
    console.log("  ✅ Passed: Coarse role guard correctly blocked non-agent actor.\n");

    // --------------------------------------------------------------------------
    // 6. Agent Registration & Agent Profile Creation
    // --------------------------------------------------------------------------
    console.log("Test 6: Agent registration, role elevation & AgentProfile creation...");
    const agentSignUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        email: agentEmail,
        password,
        name: "Test Agent Broker",
        phone: "+44 7700 900123",
      }),
    });
    if (!agentSignUpRes.ok) {
      console.error("Agent sign up error:", await agentSignUpRes.text());
    }
    assert.equal(agentSignUpRes.status, 200);
    const agentSignUpData = await agentSignUpRes.json();
    agentUserId = agentSignUpData.user.id;

    // Promote to AGENT in database
    await prisma.user.update({
      where: { id: agentUserId },
      data: { role: "AGENT", emailVerified: true },
    });

    // Sign in as Agent to refresh session
    const agentSignInRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        email: agentEmail,
        password,
      }),
    });
    if (!agentSignInRes.ok) {
      console.error("Agent sign in error:", await agentSignInRes.text());
    }
    assert.equal(agentSignInRes.status, 200);
    const agentCookie = extractCookie(agentSignInRes);

    // Create Agent Profile
    const createProfileRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: agentCookie,
      },
      body: JSON.stringify({
        licenseNumber: "EGY-RE-2026-9042",
        brokerageName: "Sotheby's International Realty Cairo",
        bioEn: "Specialist in luxury residential properties across New Cairo.",
        bioAr: "خبير في العقارات الفاخرة بالقاهرة الجديدة.",
      }),
    });

    assert.equal(createProfileRes.status, 200);
    const profileData = await createProfileRes.json();
    assert.equal(profileData.licenseNumber, "EGY-RE-2026-9042");
    assert.equal(profileData.brokerageName, "Sotheby's International Realty Cairo");
    assert.equal(profileData.isVerified, false);

    // Fetch Agent Profile
    const fetchProfileRes = await fetch(`${BASE_URL}/api/v1/me/agent-profile`, {
      headers: {
        Cookie: agentCookie,
      },
    });
    assert.equal(fetchProfileRes.status, 200);
    const fetchedProfileData = await fetchProfileRes.json();
    assert.equal(fetchedProfileData.id, profileData.id);
    console.log("  ✅ Passed: Agent profile created and retrieved successfully.\n");

    // --------------------------------------------------------------------------
    // 7. Instant Suspension (banned = true, immediate revocation)
    // --------------------------------------------------------------------------
    console.log("Test 7: Banning user immediately revokes access without cache delay...");
    await prisma.user.update({
      where: { id: buyerUserId },
      data: {
        banned: true,
        banReason: "Compliance policy violation",
      },
    });

    const bannedRes = await fetch(`${BASE_URL}/api/v1/me`, {
      headers: {
        Cookie: buyerCookie,
      },
    });

    assert.equal(bannedRes.status, 403);
    const bannedData = await bannedRes.json();
    assert.equal(bannedData.type, "/errors/account-suspended");
    assert.equal(bannedData.status, 403);
    assert.ok(bannedData.detail.includes("Compliance policy violation"));
    console.log("  ✅ Passed: Banned user immediately blocked with RFC 9457 403.\n");

    // --------------------------------------------------------------------------
    // 8. Email sign-up without a valid phone is rejected (#60)
    // --------------------------------------------------------------------------
    console.log("Test 8: POST /api/auth/sign-up/email without a valid phone is rejected...");
    const noPhoneEmail = `test_nophone_${Date.now()}@test.settly.estate`;
    for (const phone of [undefined, "12345"]) {
      const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: BASE_URL },
        body: JSON.stringify({ email: noPhoneEmail, password, name: "No Phone", phone }),
      });
      assert.equal(res.status, 400, `phone=${phone} must be rejected`);
    }
    assert.equal(await prisma.user.count({ where: { email: noPhoneEmail } }), 0);
    console.log("  ✅ Passed: missing and invalid phones rejected; no user created.\n");

    // --------------------------------------------------------------------------
    // 9. The custom OTP endpoint no longer exists (verification is link-only, #9/#106)
    // --------------------------------------------------------------------------
    console.log("Test 9: POST /api/v1/identity/verify-otp is gone...");
    const otpRes = await fetch(`${BASE_URL}/api/v1/identity/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: buyerEmail, code: "882194" }),
    });
    assert.equal(otpRes.status, 404);
    console.log("  ✅ Passed: OTP endpoint returns 404.\n");

    // --------------------------------------------------------------------------
    // 10. PATCH /api/v1/me normalises a phone and rejects an invalid one (complete-profile, #106)
    // --------------------------------------------------------------------------
    console.log("Test 10: PATCH /api/v1/me phone normalisation and validation...");
    const agentLogin = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email: agentEmail, password }),
    });
    assert.equal(agentLogin.status, 200);
    const agentCookie2 = extractCookie(agentLogin);
    const phoneOk = await fetch(`${BASE_URL}/api/v1/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: agentCookie2 },
      body: JSON.stringify({ phone: "0020 100 765 4321" }),
    });
    assert.equal(phoneOk.status, 200);
    assert.equal((await phoneOk.json()).phone, "+201007654321");
    const phoneBad = await fetch(`${BASE_URL}/api/v1/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: agentCookie2 },
      body: JSON.stringify({ phone: "not-a-phone" }),
    });
    assert.equal(phoneBad.status, 422);
    console.log("  ✅ Passed: phone normalised to E.164; invalid phone returns 422.\n");

    // --------------------------------------------------------------------------
    // 11. Sessions older than the 30-day absolute cap are revoked (V12, #106)
    // --------------------------------------------------------------------------
    console.log("Test 11: A session older than 30 days is rejected and deleted...");
    const oldToken = decodeURIComponent(agentCookie2.split("=")[1]).split(".")[0];
    const oldSession = await prisma.session.findFirst({ where: { token: oldToken } });
    assert.ok(oldSession, "Expected the agent session row");
    await prisma.session.update({
      where: { id: oldSession.id },
      data: { createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000) },
    });
    const expiredRes = await fetch(`${BASE_URL}/api/v1/me`, { headers: { Cookie: agentCookie2 } });
    assert.equal(expiredRes.status, 401);
    assert.equal(await prisma.session.count({ where: { id: oldSession.id } }), 0);
    console.log("  ✅ Passed: capped session returns 401 and is deleted.\n");

    console.log("===============================================================================");
    console.log("All Better Auth & RBAC Tests Passed Successfully! ✅");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup created test records
    console.log("Cleaning up test user fixtures from Neon database...");
    if (agentUserId) {
      try {
        await prisma.agentProfile.deleteMany({ where: { userId: agentUserId } });
        await prisma.session.deleteMany({ where: { userId: agentUserId } });
        await prisma.account.deleteMany({ where: { userId: agentUserId } });
        await prisma.user.deleteMany({ where: { id: agentUserId } });
      } catch (e) {
        console.warn("Agent cleanup warning:", e.message);
      }
    }
    if (buyerUserId) {
      try {
        await prisma.verification.deleteMany({ where: { identifier: buyerEmail } });
        await prisma.session.deleteMany({ where: { userId: buyerUserId } });
        await prisma.account.deleteMany({ where: { userId: buyerUserId } });
        await prisma.user.deleteMany({ where: { id: buyerUserId } });
        await prisma.user.deleteMany({ where: { email: { startsWith: "test_nophone_" } } });
      } catch (e) {
        console.warn("Buyer cleanup warning:", e.message);
      }
    }
    await prisma.$disconnect();
    server.close();
  }
}

run().catch((err) => {
  console.error("Auth test failed with error:", err);
  server.close();
  process.exit(1);
});
