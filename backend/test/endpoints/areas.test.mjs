process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";
import { buildAreaData } from "../harness/factories.mjs";

console.log("===============================================================================");
console.log("Settly Backend: RFC 9457 & /api/v1/areas Endpoint Verification Suite");
console.log("===============================================================================\n");

const PORT = 4002;
const BASE_URL = `http://localhost:${PORT}`;

async function run() {
  await new Promise((resolve) => {
    server.listen(PORT, resolve);
  });
  console.log(`Test server running at ${BASE_URL}\n`);

  let createdAreaId = null;

  try {
    // 1. GET /api/v1/areas (List areas)
    console.log("Test 1: GET /api/v1/areas returns 200 and { items: [...] }...");
    const res1 = await fetch(`${BASE_URL}/api/v1/areas`);
    assert.equal(res1.status, 200, "Expected status 200");
    assert.ok(
      res1.headers.get("content-type")?.includes("application/json"),
      "Expected application/json content-type"
    );
    const data1 = await res1.json();
    assert.ok(Array.isArray(data1.items), "Expected items array in response");
    console.log(`  ✅ Passed: Retrieved ${data1.items.length} areas.\n`);

    // 2. RFC 9457 422 on Invalid Query Parameter
    console.log("Test 2: GET /api/v1/areas?level=INVALID returns RFC 9457 422...");
    const res2 = await fetch(`${BASE_URL}/api/v1/areas?level=INVALID_LEVEL`);
    assert.equal(res2.status, 422, "Expected status 422");
    assert.ok(
      res2.headers.get("content-type")?.includes("application/problem+json"),
      "Expected application/problem+json content-type"
    );
    const data2 = await res2.json();
    assert.equal(data2.type, "/errors/validation-failed", "Expected validation-failed type");
    assert.equal(data2.status, 422, "Expected 422 status in body");
    assert.equal(data2.title, "Validation Failed");
    assert.ok(typeof data2.requestId === "string" && data2.requestId.length > 0, "Expected requestId in problem details");
    assert.equal(res2.headers.get("x-request-id"), data2.requestId, "Header X-Request-Id must match body requestId");
    assert.ok(Array.isArray(data2.errors), "Expected errors array");
    const levelError = data2.errors.find((e) => e.path === "level");
    assert.ok(levelError, "Expected validation error for 'level'");
    console.log("  ✅ Passed: Returned RFC 9457 problem details with correlation ID.\n");

    // 3. RFC 9457 404 on Non-existent Area ID
    console.log("Test 3: GET /api/v1/areas/:id on non-existent UUIDv7 returns RFC 9457 404...");
    const nonExistentId = "0191eb45-8f67-73d8-9db8-bc234a9e51c8";
    const res3 = await fetch(`${BASE_URL}/api/v1/areas/${nonExistentId}`);
    assert.equal(res3.status, 404, "Expected status 404");
    assert.ok(
      res3.headers.get("content-type")?.includes("application/problem+json"),
      "Expected application/problem+json content-type"
    );
    const data3 = await res3.json();
    assert.equal(data3.type, "/errors/not-found", "Expected /errors/not-found type");
    assert.equal(data3.status, 404);
    assert.ok(typeof data3.requestId === "string", "Expected requestId in problem details");
    assert.equal(res3.headers.get("x-request-id"), data3.requestId, "Header X-Request-Id must match body requestId");
    console.log("  ✅ Passed: Returned RFC 9457 404 Not Found.\n");

    // 4. RFC 9457 422 on Malformed UUID Path Param
    console.log("Test 4: GET /api/v1/areas/not-a-uuid returns RFC 9457 422...");
    const res4 = await fetch(`${BASE_URL}/api/v1/areas/not-a-uuid`);
    assert.equal(res4.status, 422, "Expected status 422");
    assert.ok(
      res4.headers.get("content-type")?.includes("application/problem+json"),
      "Expected application/problem+json content-type"
    );
    const data4 = await res4.json();
    assert.equal(data4.type, "/errors/validation-failed");
    assert.equal(data4.status, 422);
    console.log("  ✅ Passed: Malformed path param rejected as RFC 9457 422.\n");

    // 5. RFC 9457 404 on Unmatched Routes
    console.log("Test 5: GET /api/v1/unknown-endpoint returns RFC 9457 404...");
    const res5 = await fetch(`${BASE_URL}/api/v1/unknown-endpoint`);
    assert.equal(res5.status, 404, "Expected status 404");
    assert.ok(
      res5.headers.get("content-type")?.includes("application/problem+json"),
      "Expected application/problem+json content-type"
    );
    const data5 = await res5.json();
    assert.equal(data5.type, "/errors/not-found");
    assert.equal(data5.status, 404);
    assert.ok(data5.detail.includes("/api/v1/unknown-endpoint"));
    console.log("  ✅ Passed: Unmatched routes return RFC 9457 404.\n");

    // 6. Real Database Integration & Bare Single Resource
    console.log("Test 6: Database integration and bare single resource response...");
    const areaFixture = buildAreaData({
      nameEn: "New Administrative Capital",
      nameAr: "العاصمة الإدارية الجديدة",
      slug: `nac-${Date.now()}`,
      level: "CITY",
    });
    const createdArea = await prisma.area.create({ data: areaFixture });
    createdAreaId = createdArea.id;

    // Fetch single area (bare resource without wrapper)
    const res6 = await fetch(`${BASE_URL}/api/v1/areas/${createdArea.id}`);
    assert.equal(res6.status, 200);
    const data6 = await res6.json();
    assert.equal(data6.id, createdArea.id);
    assert.equal(data6.slug, createdArea.slug);
    assert.equal(data6.nameEn, "New Administrative Capital");
    assert.equal(data6.nameAr, "العاصمة الإدارية الجديدة");
    assert.equal(data6.level, "CITY");
    assert.equal(data6.items, undefined, "Single resource MUST NOT be wrapped in items (Decision #40)");

    // Query list filtered by level=CITY
    const res7 = await fetch(`${BASE_URL}/api/v1/areas?level=CITY`);
    assert.equal(res7.status, 200);
    const data7 = await res7.json();
    assert.ok(Array.isArray(data7.items));
    const found = data7.items.find((a) => a.id === createdArea.id);
    assert.ok(found, "Created area must appear in filtered list");
    console.log("  ✅ Passed: Database insert, bare resource fetch, and filtered list verified.\n");

    console.log("===============================================================================");
    console.log("All Endpoint & RFC 9457 Tests Passed Successfully! ✅");
    console.log("===============================================================================\n");
  } finally {
    if (createdAreaId) {
      try {
        await prisma.area.delete({ where: { id: createdAreaId } });
      } catch (err) {
        console.warn("Could not delete test area fixture:", err);
      }
    }
    await prisma.$disconnect();
    server.close();
  }
}

run().catch((err) => {
  console.error("Endpoint test failed with error:", err);
  server.close();
  process.exit(1);
});
