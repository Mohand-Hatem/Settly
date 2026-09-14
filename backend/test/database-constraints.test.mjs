import { PrismaClient } from "@prisma/client";
import {
  buildUserData,
  buildAreaData,
  buildPropertyData,
  buildViewingData,
  buildOfferData,
  buildPaymentData,
  buildPaymentAttemptData,
  buildAuditLogData,
} from "./harness/factories.mjs";
import { withRollback } from "./harness/isolation.mjs";

const prisma = new PrismaClient();

async function runConstraintTests() {
  console.log("Starting Database Constraints & Invariants Verification (Layer 3 & 4)...");

  try {
    // ------------------------------------------------------------------------
    // 1. AuditLog Immutability Trigger (audit_log_immutable_trg)
    // ------------------------------------------------------------------------
    console.log("Testing Invariant: AuditLog append-only trigger (UPDATE)...");
    await withRollback(prisma, async (tx) => {
      const logData = buildAuditLogData();
      await tx.auditLog.create({ data: logData });

      let updateFailed = false;
      try {
        await tx.$executeRawUnsafe(
          `UPDATE "AuditLog" SET "action" = 'TAMPERED' WHERE "id" = '${logData.id}'`
        );
      } catch (err) {
        updateFailed = true;
        if (!err.message.includes("AuditLog is append-only")) {
          throw new Error(`Unexpected error message on UPDATE: ${err.message}`);
        }
      }
      if (!updateFailed) {
        throw new Error("FAILED: AuditLog UPDATE was permitted by the database!");
      }
      console.log("  ✅ AuditLog trigger successfully blocked UPDATE.");
    });

    console.log("Testing Invariant: AuditLog append-only trigger (DELETE)...");
    await withRollback(prisma, async (tx) => {
      const logData = buildAuditLogData();
      await tx.auditLog.create({ data: logData });

      let deleteFailed = false;
      try {
        await tx.$executeRawUnsafe(`DELETE FROM "AuditLog" WHERE "id" = '${logData.id}'`);
      } catch (err) {
        deleteFailed = true;
        if (!err.message.includes("AuditLog is append-only")) {
          throw new Error(`Unexpected error message on DELETE: ${err.message}`);
        }
      }
      if (!deleteFailed) {
        throw new Error("FAILED: AuditLog DELETE was permitted by the database!");
      }
      console.log("  ✅ AuditLog trigger successfully blocked DELETE.");
    });

    // ------------------------------------------------------------------------
    // 2. Viewing Overlap Exclusion Constraint (viewing_agent_overlap_excl)
    // ------------------------------------------------------------------------
    console.log("Testing Invariant: Viewing overlap exclusion constraint (tstzrange)...");
    await withRollback(prisma, async (tx) => {
      const agent = buildUserData({ role: "AGENT" });
      const buyer1 = buildUserData({ role: "USER" });
      const buyer2 = buildUserData({ role: "USER" });
      const area = buildAreaData();
      await tx.user.createMany({ data: [agent, buyer1, buyer2] });
      await tx.area.create({ data: area });

      const property = buildPropertyData(agent.id, area.id);
      await tx.property.create({ data: property });

      // First confirmed viewing: 10:00 -> 11:00 UTC
      const viewing1 = buildViewingData(buyer1.id, agent.id, property.id, {
        startsAt: new Date("2026-10-01T10:00:00.000Z"),
        endsAt: new Date("2026-10-01T11:00:00.000Z"),
        status: "CONFIRMED",
      });
      await tx.viewing.create({ data: viewing1 });

      // Overlapping confirmed viewing: 10:30 -> 11:30 UTC -> MUST throw exclusion constraint violation
      const viewing2 = buildViewingData(buyer2.id, agent.id, property.id, {
        startsAt: new Date("2026-10-01T10:30:00.000Z"),
        endsAt: new Date("2026-10-01T11:30:00.000Z"),
        status: "CONFIRMED",
      });

      let overlapBlocked = false;
      try {
        await tx.viewing.create({ data: viewing2 });
      } catch (err) {
        overlapBlocked = true;
        // Postgres error 23P01 = exclusion_violation
        if (!err.message.includes("viewing_agent_overlap_excl") && !err.message.includes("23P01")) {
          console.warn("  Warning: exclusion violation triggered without explicit name:", err.message);
        }
      }

      if (!overlapBlocked) {
        throw new Error("FAILED: Overlapping confirmed viewings were permitted for the same agent!");
      }

      console.log("  ✅ Exclusion constraint successfully blocked overlapping confirmed viewing.");
    });

    // ------------------------------------------------------------------------
    // 3. Deposit Race Invariant I1 (offer_property_reserved_completed_idx)
    // ------------------------------------------------------------------------
    console.log("Testing Invariant I1: Single active reserved/completed offer per property...");
    await withRollback(prisma, async (tx) => {
      const agent = buildUserData({ role: "AGENT" });
      const buyer1 = buildUserData({ role: "USER" });
      const buyer2 = buildUserData({ role: "USER" });
      const area = buildAreaData();
      await tx.user.createMany({ data: [agent, buyer1, buyer2] });
      await tx.area.create({ data: area });

      const property = buildPropertyData(agent.id, area.id);
      await tx.property.create({ data: property });

      const offer1 = buildOfferData(buyer1.id, agent.id, property.id, { status: "RESERVED" });
      await tx.offer.create({ data: offer1 });

      const offer2 = buildOfferData(buyer2.id, agent.id, property.id, { status: "RESERVED" });
      let secondReservedBlocked = false;
      try {
        await tx.offer.create({ data: offer2 });
      } catch (err) {
        secondReservedBlocked = true;
        if (!err.message.includes("offer_property_reserved_completed_idx") && !err.message.includes("23505")) {
          console.warn("  Warning: unique violation triggered without explicit name:", err.message);
        }
      }

      if (!secondReservedBlocked) {
        throw new Error("FAILED: Two RESERVED offers were permitted on the same property!");
      }

      console.log("  ✅ Partial unique index successfully blocked rival RESERVED offer.");
    });

    // ------------------------------------------------------------------------
    // 4. Payment Attempt Concurrency (payment_attempt_non_terminal_idx)
    // ------------------------------------------------------------------------
    console.log("Testing Invariant: Single non-terminal payment attempt per payment...");
    await withRollback(prisma, async (tx) => {
      const agent = buildUserData({ role: "AGENT" });
      const buyer = buildUserData({ role: "USER" });
      const area = buildAreaData();
      await tx.user.createMany({ data: [agent, buyer] });
      await tx.area.create({ data: area });

      const property = buildPropertyData(agent.id, area.id);
      await tx.property.create({ data: property });

      const offer = buildOfferData(buyer.id, agent.id, property.id, { status: "ACCEPTED" });
      await tx.offer.create({ data: offer });

      const payment = buildPaymentData(offer.id, buyer.id);
      await tx.payment.create({ data: payment });

      const attempt1 = buildPaymentAttemptData(payment.id, { status: "INITIATED" });
      await tx.paymentAttempt.create({ data: attempt1 });

      const attempt2 = buildPaymentAttemptData(payment.id, { status: "INITIATED" });
      let secondInitiatedBlocked = false;
      try {
        await tx.paymentAttempt.create({ data: attempt2 });
      } catch (_err) {
        secondInitiatedBlocked = true;
      }

      if (!secondInitiatedBlocked) {
        throw new Error("FAILED: Multiple INITIATED payment attempts permitted on the same payment!");
      }

      console.log("  ✅ Partial unique index successfully blocked concurrent INITIATED attempt.");
    });

    // ------------------------------------------------------------------------
    // 5. Generated FTS Columns & Arabic Normalization (searchVectorEn & searchVectorAr)
    // ------------------------------------------------------------------------
    console.log("Testing FTS generated columns and Arabic normalization...");
    await withRollback(prisma, async (tx) => {
      const agent = buildUserData({ role: "AGENT" });
      const area = buildAreaData();
      await tx.user.create({ data: agent });
      await tx.area.create({ data: area });

      const property = buildPropertyData(agent.id, area.id, {
        titleEn: "Modern Villa with private swimming pool",
        descriptionEn: "Exclusive residential unit with scenic garden",
        titleAr: "فيلا فاخرة مع حمام سباحة خاص",
        descriptionAr: "وحدة سكنية راقية في موقع متميز",
      });
      await tx.property.create({ data: property });

      const [row] = await tx.$queryRawUnsafe(`
        SELECT 
          "searchVectorEn"::text as "vecEn",
          "searchVectorAr"::text as "vecAr",
          ("searchVectorEn" @@ to_tsquery('english', 'swimming & pool')) as "enMatch",
          ("searchVectorAr" @@ to_tsquery('simple', 'سباحه')) as "arMatch"
        FROM "Property"
        WHERE "id" = '${property.id}'
      `);

      if (!row || !row.enMatch) {
        throw new Error(`FAILED: searchVectorEn did not match English query. Row: ${JSON.stringify(row)}`);
      }
      if (!row.arMatch) {
        throw new Error(`FAILED: searchVectorAr did not match normalized Arabic query. Row: ${JSON.stringify(row)}`);
      }

      console.log("  ✅ English & Arabic generated search vectors match accurately with normalization.");
    });

    // ------------------------------------------------------------------------
    // 6. PostGIS Geography Location Synchronization Trigger
    // ------------------------------------------------------------------------
    console.log("Testing PostGIS location sync trigger (ST_Point geography)...");
    await withRollback(prisma, async (tx) => {
      const agent = buildUserData({ role: "AGENT" });
      const area = buildAreaData();
      await tx.user.create({ data: agent });
      await tx.area.create({ data: area });

      const property = buildPropertyData(agent.id, area.id, {
        latitude: 30.0444,
        longitude: 31.2357,
      });
      await tx.property.create({ data: property });

      const [row] = await tx.$queryRawUnsafe(`
        SELECT ST_AsText("location") as "wkt"
        FROM "Property"
        WHERE "id" = '${property.id}'
      `);

      if (!row || !row.wkt || !row.wkt.includes("POINT(31.2357 30.0444)")) {
        throw new Error(`FAILED: PostGIS location trigger did not populate expected point. Got: ${JSON.stringify(row)}`);
      }

      console.log(`  ✅ Location geometry correctly populated: ${row.wkt}`);
    });

    console.log("\n🎉 ALL DATABASE CONSTRAINTS & INVARIANTS VERIFIED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Database constraints verification failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runConstraintTests();
