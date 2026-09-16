import assert from "node:assert/strict";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:4000";

async function run() {
  console.log(`Connecting to Settly API at ${BASE_URL}\n`);

  // 1. Test GET /api/v1/properties
  console.log("Testing GET /api/v1/properties...");
  const res = await fetch(`${BASE_URL}/api/v1/properties`);
  assert.equal(res.status, 200);
  const json = await res.json();
  const count = json.items?.length || 0;
  console.log(`  ✅ Status 200: Found ${count} published properties.`);
  assert.ok(count >= 8, `Expected at least 8 seeded properties, got ${count}`);

  // 2. Test GET /api/v1/properties/slug/lake-view-signature-villa
  console.log("Testing GET /api/v1/properties/slug/lake-view-signature-villa...");
  const slugRes = await fetch(`${BASE_URL}/api/v1/properties/slug/lake-view-signature-villa`);
  assert.equal(slugRes.status, 200);
  const property = await slugRes.json();
  console.log(`  ✅ Status 200: Property retrieved successfully!`);
  console.log(`     Title: ${property.titleEn}`);
  console.log(`     Price (piastres): ${property.price}`);
  console.log(`     Area: ${property.area?.nameEn}`);
  console.log(`     Images: ${property.images?.length}`);
  console.log(`     Amenities: ${property.amenities?.length}`);
  console.log(`     Agent: ${property.agent?.name}`);

  assert.equal(property.titleEn, "Lake View Signature Villa");
  assert.equal(property.area?.nameEn, "Golden Square");
  assert.ok(property.images?.length > 0);

  console.log("\n🎉 Catalog Endpoint Verification Passed Completely!\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
