process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { viewingService } from "../../dist/modules/pipeline/index.js";
import { buildAreaData, buildPropertyData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: Viewing Pipeline (V1–V11, I9, R4) Verification Suite");
console.log("===============================================================================\n");

const PORT = 4007;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];
let areaId = null;
let propertyId = null;

function cookieOf(res) {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function signUp(label, { role = "USER", verified = true } = {}) {
  const email = `test_view_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Viewing ${label}`, phone: "+201001112233" }),
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

const newKey = () => `test-${randomUUID()}`;
const request = (who, startsAt, key = newKey()) =>
  api("POST", "/api/v1/viewings", { cookie: who.cookie, key, body: { propertyId, startsAt } });

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    const agent = await signUp("agent", { role: "AGENT" });
    const buyer1 = await signUp("buyer1");
    const buyer2 = await signUp("buyer2");
    const buyer3 = await signUp("buyer3");
    const unverified = await signUp("unverified", { verified: false });

    const area = buildAreaData();
    areaId = area.id;
    await prisma.area.create({ data: area });
    const property = buildPropertyData(agent.id, area.id, { status: "PUBLISHED", listingIntent: "SALE" });
    propertyId = property.id;
    await prisma.property.create({ data: property });

    // 1. Availability
    console.log("Test 1: Agent sets weekly availability (every day 09:00–17:00 Cairo)...");
    const windows = [0, 1, 2, 3, 4, 5, 6].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "17:00" }));
    const put = await api("PUT", "/api/v1/me/availability", { cookie: agent.cookie, body: { windows, blackouts: [] } });
    assert.equal(put.status, 200);
    assert.equal(put.body.windows.length, 7);
    const tooShort = await api("PUT", "/api/v1/me/availability", {
      cookie: agent.cookie,
      body: { windows: [{ dayOfWeek: 1, startTime: "09:00", endTime: "09:30" }], blackouts: [] },
    });
    assert.equal(tooShort.status, 422);
    const buyerPut = await api("PUT", "/api/v1/me/availability", { cookie: buyer1.cookie, body: { windows, blackouts: [] } });
    assert.equal(buyerPut.status, 403);
    console.log("  ✅ Passed: availability saved; short window 422; buyer 403.\n");

    // 2. Slots
    console.log("Test 2: Public slots are 60-minute, future, within 30 days...");
    const slotsRes = await api("GET", `/api/v1/properties/${propertyId}/viewing-slots`);
    assert.equal(slotsRes.status, 200);
    const slots = slotsRes.body.slots;
    assert.ok(slots.length >= 10, "expected many slots");
    for (const s of slots) {
      assert.equal(new Date(s.endsAt) - new Date(s.startsAt), 60 * 60 * 1000);
      assert.ok(new Date(s.startsAt) > new Date());
      assert.ok(new Date(s.startsAt) <= new Date(Date.now() + 31 * 24 * 3600 * 1000));
    }
    const at = (i) => slots[i].startsAt;
    console.log(`  ✅ Passed: ${slots.length} slots.\n`);

    // 3. Guards
    console.log("Test 3: V1 guards (verification, idempotency key, self-dealing, slot)...");
    assert.equal((await request(unverified, at(0))).body.type, "/errors/email-not-verified");
    const noKey = await api("POST", "/api/v1/viewings", { cookie: buyer1.cookie, body: { propertyId, startsAt: at(0) } });
    assert.equal(noKey.status, 400);
    assert.equal((await request(agent, at(0))).status, 403);
    const offSlot = new Date(new Date(at(0)).getTime() + 15 * 60 * 1000).toISOString();
    assert.equal((await request(buyer1, offSlot)).body.type, "/errors/slot-unavailable");
    console.log("  ✅ Passed.\n");

    // 4. Create + idempotent replay
    console.log("Test 4: Request + idempotent replay; lead created...");
    const key = newKey();
    const v1 = await request(buyer1, at(0), key);
    assert.equal(v1.status, 201);
    assert.equal(v1.body.status, "REQUESTED");
    assert.equal(v1.body.buyer, null, "buyer view never exposes the buyer object");
    const replay = await request(buyer1, at(0), key);
    assert.equal(replay.body.id, v1.body.id);
    assert.equal(replay.headers.get("idempotent-replayed"), "true");
    assert.equal(await prisma.viewing.count({ where: { buyerId: buyer1.id } }), 1);
    assert.equal(await prisma.lead.count({ where: { buyerId: buyer1.id, propertyId } }), 1);
    console.log("  ✅ Passed.\n");

    // 5. Same slot from another buyer is allowed (exclusivity at confirmation)
    console.log("Test 5: A second buyer may request the same slot...");
    const v2 = await request(buyer2, at(0));
    assert.equal(v2.status, 201);
    console.log("  ✅ Passed.\n");

    // 6. I9 under concurrency
    console.log("Test 6: I9 — 5 parallel requests by one buyer, exactly 3 succeed...");
    const burst = await Promise.all([1, 2, 3, 4, 5].map((i) => request(buyer3, at(i))));
    const created = burst.filter((r) => r.status === 201).length;
    const limited = burst.filter((r) => r.body?.type === "/errors/open-viewing-limit").length;
    assert.equal(created, 3);
    assert.equal(limited, 2);
    console.log("  ✅ Passed.\n");

    // 7. Confirm auto-declines rivals; slot disappears
    console.log("Test 7: V2 confirm auto-declines the rival request; slot removed...");
    const conf = await api("POST", `/api/v1/viewings/${v1.body.id}/confirm`, { cookie: agent.cookie });
    assert.equal(conf.status, 200);
    assert.equal(conf.body.status, "CONFIRMED");
    const rival = await prisma.viewing.findUnique({ where: { id: v2.body.id } });
    assert.equal(rival.status, "DECLINED");
    assert.equal(rival.cancelledBy, "SYSTEM");
    const after = await api("GET", `/api/v1/properties/${propertyId}/viewing-slots`);
    assert.ok(!after.body.slots.some((s) => s.startsAt === at(0)));
    const buyerConfirm = await api("POST", `/api/v1/viewings/${v1.body.id}/confirm`, { cookie: buyer1.cookie });
    assert.equal(buyerConfirm.status, 403, "buyers cannot confirm");
    console.log("  ✅ Passed.\n");

    // 8. R4 race: two overlapping requests confirmed in parallel
    console.log("Test 8: R4 — parallel confirmations of overlapping requests, exactly one wins...");
    const [ra, rb] = await Promise.all([request(buyer1, at(8)), request(buyer2, at(8))]);
    assert.equal(ra.status, 201);
    assert.equal(rb.status, 201);
    const race = await Promise.all([
      api("POST", `/api/v1/viewings/${ra.body.id}/confirm`, { cookie: agent.cookie }),
      api("POST", `/api/v1/viewings/${rb.body.id}/confirm`, { cookie: agent.cookie }),
    ]);
    assert.equal(race.filter((r) => r.status === 200).length, 1);
    assert.equal(race.filter((r) => r.status === 409).length, 1);
    assert.equal(
      await prisma.viewing.count({ where: { propertyId, status: "CONFIRMED", startsAt: new Date(at(8)) } }),
      1
    );
    console.log("  ✅ Passed.\n");

    // 9. Reschedule proposal accepted
    console.log("Test 9: V4 propose → V5 accept...");
    const pending = await api("GET", "/api/v1/me/viewings?scope=pending", { cookie: buyer3.cookie });
    const toMove = pending.body.items[0];
    const proposed = await api("POST", `/api/v1/viewings/${toMove.id}/propose-reschedule`, {
      cookie: agent.cookie,
      body: { startsAt: at(12) },
    });
    assert.equal(proposed.status, 200);
    assert.equal(proposed.body.status, "RESCHEDULE_PROPOSED");
    const accepted = await api("POST", `/api/v1/viewings/${toMove.id}/accept-reschedule`, { cookie: buyer3.cookie });
    assert.equal(accepted.status, 200);
    assert.equal(accepted.body.status, "CONFIRMED");
    assert.equal(accepted.body.startsAt, at(12));
    console.log("  ✅ Passed.\n");

    // 10. Cancellation rules
    console.log("Test 10: V7 needs a reason; V6a withdraws a pending request; 404 for strangers...");
    const noReason = await api("POST", `/api/v1/viewings/${toMove.id}/cancel`, { cookie: buyer3.cookie, body: {} });
    assert.equal(noReason.status, 422);
    const cancelled = await api("POST", `/api/v1/viewings/${toMove.id}/cancel`, {
      cookie: buyer3.cookie,
      body: { reason: "Plans changed" },
    });
    assert.equal(cancelled.body.status, "CANCELLED");
    assert.equal(cancelled.body.cancelledBy, "USER");
    const other = pending.body.items[1];
    const withdrawn = await api("POST", `/api/v1/viewings/${other.id}/cancel`, { cookie: buyer3.cookie, body: {} });
    assert.equal(withdrawn.body.status, "CANCELLED");
    const stranger = await api("GET", `/api/v1/viewings/${other.id}`, { cookie: buyer1.cookie });
    assert.equal(stranger.status, 404);
    console.log("  ✅ Passed.\n");

    // 11. Timing guards
    console.log("Test 11: V8/V9 not allowed before the start time...");
    const early = await api("POST", `/api/v1/viewings/${v1.body.id}/complete`, { cookie: agent.cookie });
    assert.equal(early.body.type, "/errors/too-early");
    const earlyNoShow = await api("POST", `/api/v1/viewings/${v1.body.id}/no-show`, { cookie: agent.cookie });
    assert.equal(earlyNoShow.body.type, "/errors/too-early");
    console.log("  ✅ Passed.\n");

    // 12. Lists
    console.log("Test 12: Buyer and agent lists...");
    const upcoming = await api("GET", "/api/v1/me/viewings?scope=upcoming", { cookie: buyer1.cookie });
    assert.ok(upcoming.body.items.some((v) => v.id === v1.body.id));
    const agentPending = await api("GET", "/api/v1/me/agent/viewings?scope=pending", { cookie: agent.cookie });
    assert.equal(agentPending.status, 200);
    assert.ok(agentPending.body.items.every((v) => v.buyer && !("phone" in v.buyer)));
    const buyerAgentList = await api("GET", "/api/v1/me/agent/viewings?scope=pending", { cookie: buyer1.cookie });
    assert.equal(buyerAgentList.status, 403);
    console.log("  ✅ Passed.\n");

    // 13. V10 expiry
    console.log("Test 13: V10 — open requests in the past expire...");
    const stale = agentPending.body.items[0];
    await prisma.viewing.update({
      where: { id: stale.id },
      data: { startsAt: new Date(Date.now() - 3600_000), endsAt: new Date(Date.now() - 1) },
    });
    assert.ok((await viewingService.expireStaleRequests()) >= 1);
    assert.equal((await prisma.viewing.findUnique({ where: { id: stale.id } })).status, "EXPIRED");
    console.log("  ✅ Passed.\n");

    // 14. V11 listing leaves PUBLISHED
    console.log("Test 14: V11 — archiving the listing cancels its open viewings...");
    const archive = await api("POST", `/api/v1/properties/${propertyId}/archive`, { cookie: agent.cookie });
    assert.equal(archive.status, 200);
    await new Promise((r) => setTimeout(r, 500));
    const open = await prisma.viewing.count({
      where: { propertyId, status: { in: ["REQUESTED", "RESCHEDULE_PROPOSED", "CONFIRMED"] } },
    });
    assert.equal(open, 0);
    const slotsGone = await api("GET", `/api/v1/properties/${propertyId}/viewing-slots`);
    assert.equal(slotsGone.status, 404);
    console.log("  ✅ Passed.\n");

    console.log("===============================================================================");
    console.log("All Viewing Pipeline Tests Passed Successfully! ✅");
    console.log("===============================================================================\n");
  } finally {
    console.log("Cleaning up viewing test fixtures...");
    try {
      if (propertyId) {
        await prisma.viewing.deleteMany({ where: { propertyId } });
        await prisma.lead.deleteMany({ where: { propertyId } });
        await prisma.property.deleteMany({ where: { id: propertyId } });
      }
      if (areaId) await prisma.area.deleteMany({ where: { id: areaId } });
      await prisma.idempotencyKey.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.agentAvailability.deleteMany({ where: { agentId: { in: userIds } } });
      await prisma.session.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.account.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    } catch (e) {
      console.warn("Cleanup warning:", e.message);
    }
    await prisma.$disconnect();
    server.close();
  }
}

run().catch((err) => {
  console.error("❌ Viewing tests failed:", err);
  process.exit(1);
});
