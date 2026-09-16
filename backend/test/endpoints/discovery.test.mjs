process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";
import { prisma } from "../../dist/shared/database/prisma.js";

console.log("===============================================================================");
console.log("Settly Backend: Public Discovery & Market Intelligence Integration Suite");
console.log("===============================================================================\n");

const PORT = 4006;
const BASE_URL = `http://localhost:${PORT}`;

async function run() {
  await new Promise((resolve) => {
    server.listen(PORT, resolve);
  });
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    // --------------------------------------------------------------------------
    // 1. Comparison Endpoint (/api/v1/catalog/compare)
    // --------------------------------------------------------------------------
    console.log("--- 1. Testing Property Comparison Engine ---");

    // 1.1 Validation error if no IDs provided
    console.log("Test 1.1: GET /api/v1/catalog/compare without params returns 422 RFC 9457...");
    const resCompEmpty = await fetch(`${BASE_URL}/api/v1/catalog/compare`);
    assert.equal(resCompEmpty.status, 422);
    assert.ok(resCompEmpty.headers.get("content-type")?.includes("application/problem+json"));
    const errCompEmpty = await resCompEmpty.json();
    assert.equal(errCompEmpty.type, "/errors/validation-failed");
    console.log("  ✅ Passed: Rejected missing query params with 422.\n");

    // 1.2 Validation error if fewer than 2 IDs provided
    console.log("Test 1.2: GET /api/v1/catalog/compare with only 1 ID returns 422...");
    const resCompSingle = await fetch(`${BASE_URL}/api/v1/catalog/compare?ids=0191eb45-8f67-73d8-9db8-bc234a9e51c8`);
    assert.equal(resCompSingle.status, 422);
    const errCompSingle = await resCompSingle.json();
    assert.ok(errCompSingle.errors.some((e) => e.message?.includes("2 and 4")));
    console.log("  ✅ Passed: Enforces minimum 2 properties for comparison.\n");

    // 1.3 Successful comparison with published properties
    console.log("Test 1.3: GET /api/v1/catalog/compare with 2 published properties returns 200...");
    const existingProperties = await prisma.property.findMany({
      where: { status: "PUBLISHED" },
      take: 2,
    });

    if (existingProperties.length >= 2) {
      const idsParam = existingProperties.map((p) => p.id).join(",");
      const resCompSuccess = await fetch(`${BASE_URL}/api/v1/catalog/compare?ids=${idsParam}`);
      assert.equal(resCompSuccess.status, 200);
      const compData = await resCompSuccess.json();
      assert.ok(Array.isArray(compData.items));
      assert.equal(compData.items.length, 2);
      assert.ok(compData.items[0].titleEn);
      assert.ok(compData.items[0].price);
      assert.ok(Array.isArray(compData.items[0].amenities));
      console.log(`  ✅ Passed: Successfully returned side-by-side comparison for ${compData.items.length} properties.\n`);
    } else {
      console.log("  ⚠️ Skipped 1.3 (fewer than 2 published properties in DB).\n");
    }

    // --------------------------------------------------------------------------
    // 2. Area Insights Telemetry (/api/v1/areas/:identifier/insights)
    // --------------------------------------------------------------------------
    console.log("--- 2. Testing Area Market Insights & Telemetry ---");

    const anyArea = await prisma.area.findFirst();
    assert.ok(anyArea, "Expected at least one area in database");

    // 2.1 Insights by Slug or ID
    console.log(`Test 2.1: GET /api/v1/areas/${anyArea.slug}/insights returns 200 with telemetry...`);
    const resAreaInsights = await fetch(`${BASE_URL}/api/v1/areas/${anyArea.slug}/insights`);
    assert.equal(resAreaInsights.status, 200);
    const areaInsights = await resAreaInsights.json();
    assert.equal(areaInsights.area.slug, anyArea.slug);
    assert.ok(typeof areaInsights.metrics.averagePricePerSqm === "number");
    assert.ok(Array.isArray(areaInsights.historicalPriceTrend));
    assert.ok(areaInsights.historicalPriceTrend.length > 0);
    assert.ok(typeof areaInsights.propertyTypesDistribution === "object");
    console.log(`  ✅ Passed: Retrieved market telemetry (avg price: ${areaInsights.metrics.averagePricePerSqm} EGP/m²).\n`);

    // 2.2 404 for non-existent area
    console.log("Test 2.2: GET /api/v1/areas/non-existent-area-xyz/insights returns 404 RFC 9457...");
    const resArea404 = await fetch(`${BASE_URL}/api/v1/areas/non-existent-area-xyz/insights`);
    assert.equal(resArea404.status, 404);
    assert.ok(resArea404.headers.get("content-type")?.includes("application/problem+json"));
    const errArea404 = await resArea404.json();
    assert.equal(errArea404.type, "/errors/not-found");
    console.log("  ✅ Passed: Returned 404 RFC 9457 problem details for invalid area.\n");

    // --------------------------------------------------------------------------
    // 3. Market Pulse Analytics (/api/v1/analytics/market-pulse)
    // --------------------------------------------------------------------------
    console.log("--- 3. Testing Macro Market Pulse Analytics ---");

    console.log("Test 3.1: GET /api/v1/analytics/market-pulse returns 200 with FX & telemetry...");
    const resMarketPulse = await fetch(`${BASE_URL}/api/v1/analytics/market-pulse`);
    assert.equal(resMarketPulse.status, 200);
    const pulseData = await resMarketPulse.json();
    assert.ok(pulseData.macroIndicators);
    assert.ok(pulseData.currencyRates);
    assert.ok(pulseData.currencyRates.usdEgp.official > 0);
    assert.ok(pulseData.currencyRates.eurEgp.official > 0);
    assert.ok(Array.isArray(pulseData.corridorsBenchmark));
    assert.ok(pulseData.corridorsBenchmark.length > 0);
    console.log(`  ✅ Passed: Macro pulse contains ${pulseData.corridorsBenchmark.length} corridors and FX rates (USD: ${pulseData.currencyRates.usdEgp.official} EGP).\n`);

    // --------------------------------------------------------------------------
    // 4. Agent Directory & Public Profiles (/api/v1/identity/agents)
    // --------------------------------------------------------------------------
    console.log("--- 4. Testing Agent Directory & Public Profile Hub ---");

    // 4.1 List verified agents
    console.log("Test 4.1: GET /api/v1/identity/agents returns 200 with verified advisors...");
    const resAgents = await fetch(`${BASE_URL}/api/v1/identity/agents`);
    assert.equal(resAgents.status, 200);
    const agentsData = await resAgents.json();
    assert.ok(Array.isArray(agentsData.items));
    assert.ok(agentsData.total >= 1);
    assert.equal(agentsData.page, 1);
    const firstAgent = agentsData.items[0];
    assert.ok(firstAgent.licenseNumber);
    assert.equal(firstAgent.isVerified, true);
    console.log(`  ✅ Passed: Directory returned ${agentsData.items.length} verified advisors (First: ${firstAgent.name} - ${firstAgent.licenseNumber}).\n`);

    // 4.2 Agent detail by ID
    console.log(`Test 4.2: GET /api/v1/identity/agents/${firstAgent.id} returns full advisor profile...`);
    const resAgentDetail = await fetch(`${BASE_URL}/api/v1/identity/agents/${firstAgent.id}`);
    assert.equal(resAgentDetail.status, 200);
    const agentDetail = await resAgentDetail.json();
    assert.equal(agentDetail.agent.id, firstAgent.id);
    assert.ok(Array.isArray(agentDetail.listings));
    console.log(`  ✅ Passed: Retrieved advisor details with ${agentDetail.listings.length} active listings.\n`);

    // 4.3 Agent 404 for unknown identifier
    console.log("Test 4.3: GET /api/v1/identity/agents/0191eb45-8f67-73d8-9db8-bc234a9e9999 returns 404...");
    const resAgent404 = await fetch(`${BASE_URL}/api/v1/identity/agents/0191eb45-8f67-73d8-9db8-bc234a9e9999`);
    assert.equal(resAgent404.status, 404);
    const errAgent404 = await resAgent404.json();
    assert.equal(errAgent404.type, "/errors/not-found");
    console.log("  ✅ Passed: Returned 404 RFC 9457 problem details for non-existent advisor.\n");

    console.log("===============================================================================");
    console.log("🎉 ALL PUBLIC DISCOVERY & MARKET INTELLIGENCE TESTS PASSED SUCCESSFULLY!");
    console.log("===============================================================================");
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

run().catch((err) => {
  console.error("\n❌ Discovery suite failed with uncaught exception:", err);
  server.close();
  prisma.$disconnect();
  process.exit(1);
});
