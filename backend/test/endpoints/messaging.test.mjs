process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { buildAreaData, buildPropertyData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: In-App Messaging & Communication Engine Verification Suite");
console.log("===============================================================================\n");

const PORT = 4009;
const BASE_URL = `http://localhost:${PORT}`;
const password = "ValidPassword123!";
const stamp = Date.now();
const userIds = [];
let areaId = null;
let propertyId = null;

function cookieOf(res) {
  return (res.headers.get("set-cookie") ?? "").split(";")[0];
}

async function signUp(label, { role = "USER", verified = true, phone = "+201001112233" } = {}) {
  const email = `test_msg_${label}_${stamp}@test.settly.estate`;
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name: `Messaging ${label}`, phone }),
  });
  assert.equal(res.status, 200, `sign-up ${label}`);
  const { user } = await res.json();
  userIds.push(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { role, emailVerified: verified } });
  return { id: user.id, name: `Messaging ${label}`, cookie: cookieOf(res) };
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
    // 1. Fixtures setup
    const agent = await signUp("agent", { role: "AGENT", verified: true, phone: "+201099990001" });
    const buyer = await signUp("buyer", { role: "USER", verified: true, phone: "+201088880002" });
    const otherBuyer = await signUp("other_buyer", { role: "USER", verified: true, phone: "+201077770003" });

    const area = await prisma.area.create({ data: buildAreaData({ slug: `msg-area-${stamp}` }) });
    areaId = area.id;

    const property = await prisma.property.create({
      data: buildPropertyData(agent.id, area.id, {
        slug: `msg-prop-${stamp}`,
        status: "PUBLISHED",
        titleEn: "Modern Katameya Dunes Villa",
        price: 35000000n,
      }),
    });
    propertyId = property.id;

    // Add cover image to property
    await prisma.propertyImage.create({
      data: {
        id: randomUUID(),
        propertyId: property.id,
        cloudinaryPublicId: "test-cloud-id",
        url: "https://res.cloudinary.com/test/image/upload/v1/villa.jpg",
        isCover: true,
        order: 0,
      },
    });

    console.log("✓ Fixtures created (Agent, Buyer, Other Buyer, Property, Cover Image)");

    // 2. Test 1: Buyer starts conversation with agent
    console.log("\n--- Test 1: Buyer starts conversation with initial message ---");
    const initRes = await api("POST", "/api/v1/conversations", {
      cookie: buyer.cookie,
      body: {
        propertyId,
        initialMessage: "Hello, is this property available for viewing this weekend?",
      },
    });

    assert.equal(initRes.status, 200, "Should return 200 OK");
    const conversation = initRes.body;
    assert.ok(conversation.id, "Conversation should have an ID");
    assert.equal(conversation.buyerId, buyer.id, "Buyer ID matches");
    assert.equal(conversation.agentId, agent.id, "Agent ID matches");
    assert.equal(conversation.propertyId, propertyId, "Property ID matches");
    assert.equal(conversation.counterparty.id, agent.id, "Counterparty is agent");
    assert.equal(conversation.property.titleEn, "Modern Katameya Dunes Villa");
    console.log("✓ Conversation successfully created with initial message");

    // 3. Test 2: Auto-Lead generation (Decision #75)
    console.log("\n--- Test 2: Auto-lead generation check ---");
    const lead = await prisma.lead.findUnique({
      where: {
        buyerId_propertyId: {
          buyerId: buyer.id,
          propertyId,
        },
      },
    });
    assert.ok(lead, "Lead record must be created automatically on conversation initiation");
    assert.equal(lead.agentId, agent.id, "Lead assigned to listing agent");
    assert.equal(lead.status, "NEW", "Lead status initialized to NEW");
    console.log("✓ Lead record verified in PostgreSQL (status = NEW, assigned to listing agent)");

    // 4. Test 3: Invariant #59 (Agent cannot message their own listing)
    console.log("\n--- Test 3: Invariant #59 enforcement (Agent messaging own listing) ---");
    const ownRes = await api("POST", "/api/v1/conversations", {
      cookie: agent.cookie,
      body: {
        propertyId,
        initialMessage: "Messaging my own listing",
      },
    });
    assert.equal(ownRes.status, 409, "Should reject with 409 Conflict");
    assert.equal(ownRes.body.type, "/errors/conflict", "Problem Details type is conflict");
    console.log("✓ Invariant #59 enforced: agent blocked from creating conversation on own listing");

    // 5. Test 4: List conversations (/api/v1/me/conversations)
    console.log("\n--- Test 4: List user conversations ---");
    const buyerListRes = await api("GET", "/api/v1/me/conversations", { cookie: buyer.cookie });
    assert.equal(buyerListRes.status, 200);
    assert.equal(buyerListRes.body.items.length, 1);
    assert.equal(buyerListRes.body.items[0].counterparty.id, agent.id);

    const agentListRes = await api("GET", "/api/v1/me/conversations", { cookie: agent.cookie });
    assert.equal(agentListRes.status, 200);
    assert.equal(agentListRes.body.items.length, 1);
    assert.equal(agentListRes.body.items[0].counterparty.id, buyer.id);
    assert.equal(agentListRes.body.items[0].unreadCount, 1, "Agent should see 1 unread message");
    console.log("✓ List conversations verified for both Buyer and Agent with accurate unread counts");

    // 6. Test 5: Agent sends a reply message
    console.log("\n--- Test 5: Agent sends a reply message ---");
    const replyRes = await api("POST", `/api/v1/conversations/${conversation.id}/messages`, {
      cookie: agent.cookie,
      body: {
        body: "Yes, Saturday at 2:00 PM works perfectly. Would that suit you?",
      },
    });
    assert.equal(replyRes.status, 201, "Should return 201 Created");
    assert.equal(replyRes.body.senderId, agent.id);
    assert.equal(replyRes.body.body, "Yes, Saturday at 2:00 PM works perfectly. Would that suit you?");
    console.log("✓ Reply message sent and persisted");

    // 7. Test 6: Message pagination and history
    console.log("\n--- Test 6: Fetch messages history ---");
    const messagesRes = await api("GET", `/api/v1/conversations/${conversation.id}/messages`, {
      cookie: buyer.cookie,
    });
    assert.equal(messagesRes.status, 200);
    assert.equal(messagesRes.body.items.length, 2, "Should return 2 messages");
    assert.equal(messagesRes.body.items[0].senderId, buyer.id, "First message is from buyer");
    assert.equal(messagesRes.body.items[1].senderId, agent.id, "Second message is from agent");
    console.log("✓ Messages history returned in chronological order");

    // 8. Test 7: Mark conversation as read
    console.log("\n--- Test 7: Mark conversation as read ---");
    const readRes = await api("POST", `/api/v1/conversations/${conversation.id}/read`, {
      cookie: buyer.cookie,
    });
    assert.equal(readRes.status, 200);
    assert.equal(readRes.body.success, true);

    const checkMsg = await prisma.message.findUnique({
      where: { id: replyRes.body.id },
    });
    assert.equal(checkMsg.isRead, true, "Message marked read");
    assert.ok(checkMsg.readAt, "readAt timestamp populated");
    console.log("✓ Read receipt processed and verified in PostgreSQL");

    // 9. Test 8: Authorization / Information Leak Rule (Decision #40)
    console.log("\n--- Test 8: Authorization & 404 Information Leak Rule ---");
    const leakRes = await api("GET", `/api/v1/conversations/${conversation.id}/messages`, {
      cookie: otherBuyer.cookie,
    });
    assert.equal(leakRes.status, 404, "Uninvolved user must receive 404 (byte-identical leak rule)");
    assert.equal(leakRes.body.type, "/errors/not-found");
    console.log("✓ Leak protection verified: third party receives 404");

    console.log("\n===============================================================================");
    console.log("🎉 ALL IN-APP MESSAGING SUITE TESTS PASSED 100% GREEN");
    console.log("===============================================================================\n");
  } finally {
    // Teardown
    if (propertyId) {
      await prisma.message.deleteMany({ where: { conversation: { propertyId } } });
      await prisma.conversation.deleteMany({ where: { propertyId } });
      await prisma.lead.deleteMany({ where: { propertyId } });
      await prisma.propertyImage.deleteMany({ where: { propertyId } });
      await prisma.property.deleteMany({ where: { id: propertyId } });
    }
    if (areaId) {
      await prisma.area.deleteMany({ where: { id: areaId } });
    }
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((err) => {
  console.error("❌ Messaging test suite failed:", err);
  process.exit(1);
});
