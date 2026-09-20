process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { notificationService } from "../../dist/modules/notifications/service/index.js";

console.log("===============================================================================");
console.log("Settly Backend: Notification Engine & Center Verification Suite");
console.log("===============================================================================\n");

const PORT = 4010;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];

function cookieOf(res) {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function signUp(label, { role = "USER", verified = true, phone = "+201001112233" } = {}) {
  const email = `test_notif_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Notifications ${label}`, phone }),
  });
  assert.equal(res.status, 200, `sign-up ${label}`);
  const { user } = await res.json();
  userIds.push(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { role, emailVerified: verified } });
  return { id: user.id, name: `Notifications ${label}`, cookie: cookieOf(res) };
}

async function api(method, path, { cookie, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    const buyer = await signUp("buyer", { role: "USER" });
    const agent = await signUp("agent", { role: "AGENT" });
    console.log("✓ Fixtures created (Buyer, Agent)");

    // --- Test 1: Unauthenticated request rejected ---
    console.log("\n--- Test 1: Unauthenticated request rejected ---");
    const unauthRes = await api("GET", "/api/v1/notifications");
    assert.equal(unauthRes.status, 401, "Expected 401 for unauthenticated request");
    console.log("✓ 401 received for unauthenticated request");

    // --- Test 2: Generate notifications for buyer ---
    console.log("\n--- Test 2: Notification generation & formatting ---");
    const notif1 = await notificationService.notifyUser({
      userId: buyer.id,
      type: "OFFER_ACCEPTED",
      params: {
        offerId: "0191eb45-offer-1",
        propertyTitle: "Sky Villa Marassi",
        priceEgp: 25000000,
        recipientRole: "buyer",
      },
    });

    const notif2 = await notificationService.notifyUser({
      userId: buyer.id,
      type: "VIEWING_CONFIRMED",
      params: {
        viewingId: "0191eb45-view-1",
        propertyTitle: "Katameya Heights Palace",
        scheduledAt: "Tomorrow at 2:00 PM",
        recipientRole: "buyer",
      },
    });

    const notif3 = await notificationService.notifyUser({
      userId: buyer.id,
      type: "NEW_MESSAGE",
      params: {
        conversationId: "0191eb45-conv-1",
        propertyTitle: "Sky Villa Marassi",
        senderName: agent.name,
        snippet: "When are you available for contract signing?",
        recipientRole: "buyer",
      },
    });

    assert.equal(notif1.category, "DEALS");
    assert.ok(notif1.title.includes("Offer Accepted"));
    assert.ok(notif1.actionUrl.includes("/buyer/offers/0191eb45-offer-1/deposit"));

    assert.equal(notif2.category, "VIEWINGS");
    assert.ok(notif2.title.includes("Viewing Confirmed"));

    assert.equal(notif3.category, "MESSAGES");
    assert.ok(notif3.title.includes(agent.name));
    console.log("✓ Dynamic formatting verified across categories (DEALS, VIEWINGS, MESSAGES)");

    // --- Test 3: List notifications via API ---
    console.log("\n--- Test 3: List notifications API ---");
    const listRes = await api("GET", "/api/v1/notifications", { cookie: buyer.cookie });
    assert.equal(listRes.status, 200);
    assert.equal(listRes.body.items.length, 3);
    assert.equal(listRes.body.unreadCount, 3);
    assert.equal(listRes.body.totalCount, 3);
    console.log("✓ List endpoint returned 3 unread notifications with accurate counts");

    // --- Test 4: Fast unread count endpoint ---
    console.log("\n--- Test 4: Unread badge counter ---");
    const countRes = await api("GET", "/api/v1/notifications/unread-count", { cookie: buyer.cookie });
    assert.equal(countRes.status, 200);
    assert.equal(countRes.body.unreadCount, 3);
    console.log("✓ Fast unread counter confirmed (3 unread)");

    // --- Test 5: Mark single notification read ---
    console.log("\n--- Test 5: Mark single notification read ---");
    const markRes = await api("PATCH", `/api/v1/notifications/${notif1.id}/read`, { cookie: buyer.cookie });
    assert.equal(markRes.status, 200);
    assert.equal(markRes.body.success, true);

    const afterReadCount = await api("GET", "/api/v1/notifications/unread-count", { cookie: buyer.cookie });
    assert.equal(afterReadCount.body.unreadCount, 2);

    const unreadOnlyRes = await api("GET", "/api/v1/notifications?unreadOnly=true", { cookie: buyer.cookie });
    assert.equal(unreadOnlyRes.body.items.length, 2);
    assert.ok(!unreadOnlyRes.body.items.some((i) => i.id === notif1.id));
    console.log("✓ Single item marked read; unread counter updated to 2");

    // --- Test 6: Unauthorized mutation leak protection ---
    console.log("\n--- Test 6: Security & leak protection ---");
    const unauthorizedMark = await api("PATCH", `/api/v1/notifications/${notif2.id}/read`, { cookie: agent.cookie });
    assert.equal(unauthorizedMark.status, 200);
    assert.equal(unauthorizedMark.body.success, false);

    // Verify buyer's notification was NOT marked read by agent
    const verifyBuyerNotif = await prisma.notification.findUnique({ where: { id: notif2.id } });
    assert.equal(verifyBuyerNotif.isRead, false);
    console.log("✓ Cross-user mutation rejected safely");

    // --- Test 7: Mark all notifications read ---
    console.log("\n--- Test 7: Mark all notifications read ---");
    const markAllRes = await api("POST", "/api/v1/notifications/mark-all-read", { cookie: buyer.cookie });
    assert.equal(markAllRes.status, 200);
    assert.equal(markAllRes.body.success, true);

    const finalCount = await api("GET", "/api/v1/notifications/unread-count", { cookie: buyer.cookie });
    assert.equal(finalCount.body.unreadCount, 0);
    console.log("✓ All notifications marked read; unread counter is 0");

    // --- Test 8: Delete notification ---
    console.log("\n--- Test 8: Dismiss/delete notification ---");
    const deleteRes = await api("DELETE", `/api/v1/notifications/${notif3.id}`, { cookie: buyer.cookie });
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);

    const afterDeleteList = await api("GET", "/api/v1/notifications", { cookie: buyer.cookie });
    assert.equal(afterDeleteList.body.items.length, 2);
    assert.equal(afterDeleteList.body.totalCount, 2);
    console.log("✓ Notification deleted successfully");

    console.log("\n===============================================================================");
    console.log("🎉 ALL NOTIFICATION ENGINE & CENTER TESTS PASSED 100% GREEN");
    console.log("===============================================================================\n");
  } finally {
    // Cleanup fixtures
    if (userIds.length > 0) {
      await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
