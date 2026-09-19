/**
 * Slice-1 demo data (#106: slice-1 agents and listings come from the seed). Idempotent; safe to rerun.
 *
 * - Gives the seeded verified agent a phone (required, #60; never shown publicly) and weekly
 *   viewing hours in Cairo time, so buyers can request viewings on the seeded listings.
 * - Creates a password login for that agent ONLY when SEED_DEMO_PASSWORD is set. No password is
 *   ever committed; the hash comes from Better Auth's own configured hasher.
 *
 * Run: npx tsx scripts/seed-slice1-demo.ts   (after scripts/seed-catalog.ts)
 */
import { uuidv7 } from "uuidv7";
import { prisma } from "../src/shared/database/prisma.js";
import { auth } from "../src/modules/identity/auth.js";

const AGENT_EMAIL = "hana.k@settly.estate";
const DEMO_PHONE = "+201000000001";

// Sunday–Thursday 10:00–18:00, Saturday 12:00–16:00 (Cairo wall-clock). Friday off.
const WINDOWS = [
  ...[0, 1, 2, 3, 4].map((dayOfWeek) => ({ dayOfWeek, startTime: "10:00", endTime: "18:00" })),
  { dayOfWeek: 6, startTime: "12:00", endTime: "16:00" },
];

async function main() {
  const agent = await prisma.user.findUnique({ where: { email: AGENT_EMAIL } });
  if (!agent) {
    console.error(`Seeded agent ${AGENT_EMAIL} not found. Run scripts/seed-catalog.ts first.`);
    process.exit(1);
  }

  if (!agent.phone) {
    await prisma.user.update({ where: { id: agent.id }, data: { phone: DEMO_PHONE } });
    console.log("✔ Agent phone set");
  }

  const existing = await prisma.agentAvailability.count({ where: { agentId: agent.id } });
  if (existing === 0) {
    await prisma.agentAvailability.createMany({
      data: WINDOWS.map((w) => ({ id: uuidv7(), agentId: agent.id, ...w, isBlackout: false })),
    });
    console.log("✔ Weekly viewing hours created");
  } else {
    console.log("• Availability already present — left unchanged");
  }

  const password = process.env.SEED_DEMO_PASSWORD;
  if (!password) {
    console.log("• SEED_DEMO_PASSWORD not set — no login created for the demo agent");
  } else if (password.length < 8) {
    console.error("SEED_DEMO_PASSWORD must be at least 8 characters.");
    process.exit(1);
  } else {
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(password);
    const account = await prisma.account.findFirst({ where: { userId: agent.id, providerId: "credential" } });
    if (account) {
      await prisma.account.update({ where: { id: account.id }, data: { password: hash } });
    } else {
      await prisma.account.create({
        data: { id: uuidv7(), userId: agent.id, accountId: agent.id, providerId: "credential", password: hash },
      });
    }
    console.log(`✔ Demo login ready for ${AGENT_EMAIL}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
