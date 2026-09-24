/**
 * Embeds all published properties in the catalog with 1536-dimensional L2-normalized vectors.
 * Governed by SEARCH.md §7 and AI.md §2. Idempotent and safe to run repeatedly.
 *
 * Run: npx tsx scripts/embed-catalog.ts
 */
import { prisma } from "../src/shared/database/prisma.js";
import { embeddingService } from "../src/modules/ai/service/embedding.service.js";

async function main() {
  console.log("🔍 Scanning properties for embedding generation...");

  const properties = await prisma.property.findMany({
    where: { status: { in: ["PUBLISHED", "RESERVED"] } },
    include: {
      area: { select: { nameEn: true } },
      amenities: { include: { amenity: true } },
    },
  });

  console.log(`Found ${properties.length} published/reserved properties.`);

  let embeddedCount = 0;
  for (const prop of properties) {
    const amenities = prop.amenities.map((a) => a.amenity.nameEn);
    const vector = await embeddingService.embedProperty({
      titleEn: prop.titleEn,
      descriptionEn: prop.descriptionEn,
      propertyType: prop.propertyType,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      areaNameEn: prop.area.nameEn,
      amenities,
    });

    const vectorStr = `[${vector.join(",")}]`;

    await prisma.$executeRawUnsafe(
      `UPDATE "Property" SET "embedding" = $1::vector, "updatedAt" = NOW() WHERE "id" = $2`,
      vectorStr,
      prop.id
    );

    embeddedCount++;
    console.log(`  [${embeddedCount}/${properties.length}] Embedded: ${prop.titleEn || prop.slug}`);
  }

  console.log(`🎉 Successfully embedded ${embeddedCount} properties into PostgreSQL pgvector.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Embedding generation failed:", err);
  process.exit(1);
});
