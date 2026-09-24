process.env.NODE_ENV = "test";
import assert from "node:assert/strict";
import { server } from "../../dist/settly-api.js";

console.log("===============================================================================");
console.log("Settly Backend: Hybrid Search Engine (SEARCH.md §4-6) Test Suite");
console.log("===============================================================================\n");

const PORT = 4012;
const BASE_URL = `http://localhost:${PORT}`;

async function api(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

async function run() {
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running at ${BASE_URL}\n`);

  try {
    // --------------------------------------------------------------------------
    // Test 1: Search Health Endpoint
    // --------------------------------------------------------------------------
    console.log("Test 1: Healthcheck GET /api/v1/search/health");
    {
      const res = await api("/api/v1/search/health");
      assert.equal(res.status, 200, "health status 200");
      assert.equal(res.body.module, "search");
      assert.equal(res.body.status, "ok");
      console.log("  ✔ Healthcheck passed\n");
    }

    // --------------------------------------------------------------------------
    // Test 2: Basic Properties Search
    // --------------------------------------------------------------------------
    console.log("Test 2: Basic Search GET /api/v1/search/properties");
    {
      const res = await api("/api/v1/search/properties?limit=10");
      assert.equal(res.status, 200, "search status 200");
      assert.ok(Array.isArray(res.body.items), "items is an array");
      assert.ok(res.body.total > 0, "total properties > 0");
      assert.equal(typeof res.body.degraded, "boolean", "degraded flag is boolean");
      assert.ok(Array.isArray(res.body.chips), "chips is an array");

      const item = res.body.items[0];
      assert.ok(item.id, "item has id");
      assert.ok(item.titleEn, "item has titleEn");
      assert.ok(item.price, "item has price");
      assert.ok(item.area && item.area.nameEn, "item has area name");
      console.log(`  ✔ Returned ${res.body.items.length} items (total: ${res.body.total})\n`);
    }

    // --------------------------------------------------------------------------
    // Test 3: Structured Filters (Type, Bedrooms, Intent, Price Range)
    // --------------------------------------------------------------------------
    console.log("Test 3: Structured Filters");
    {
      // 3a. Property Type filter: VILLA
      const resType = await api("/api/v1/search/properties?propertyType=VILLA");
      assert.equal(resType.status, 200);
      assert.ok(resType.body.items.length > 0, "found villas");
      for (const item of resType.body.items) {
        assert.equal(item.propertyType, "VILLA", "all items are villas");
      }
      console.log(`  ✔ Filter propertyType=VILLA returned ${resType.body.items.length} villas`);

      // 3b. Bedrooms filter: bedrooms >= 4
      const resBeds = await api("/api/v1/search/properties?bedrooms=4");
      assert.equal(resBeds.status, 200);
      for (const item of resBeds.body.items) {
        assert.ok(item.bedrooms >= 4, `item bedrooms (${item.bedrooms}) >= 4`);
      }
      console.log(`  ✔ Filter bedrooms=4 verified`);

      // 3c. Listing Intent filter: SALE
      const resIntent = await api("/api/v1/search/properties?intent=SALE");
      assert.equal(resIntent.status, 200);
      for (const item of resIntent.body.items) {
        assert.equal(item.listingIntent, "SALE", "all items are for sale");
      }
      console.log(`  ✔ Filter intent=SALE verified`);

      // 3d. Price Bounds: minPrice=1500000000, maxPrice=3500000000 (15M–35M EGP in piastres)
      const resPrice = await api("/api/v1/search/properties?minPrice=1500000000&maxPrice=3500000000");
      assert.equal(resPrice.status, 200);
      assert.ok(resPrice.body.items.length > 0, "found items within 15M–35M price bounds");
      for (const item of resPrice.body.items) {
        const p = BigInt(item.price);
        assert.ok(p >= 1500000000n && p <= 3500000000n, `price ${p} within 15M–35M`);
      }
      console.log(`  ✔ Price bounds filter verified\n`);
    }

    // --------------------------------------------------------------------------
    // Test 4: Query Understanding & Deterministic Extraction
    // --------------------------------------------------------------------------
    console.log("Test 4: Natural Language Query Understanding");
    {
      const res = await api("/api/v1/search/properties?q=villas+in+New+Cairo+under+40M+with+4+beds");
      assert.equal(res.status, 200);
      assert.ok(res.body.chips.length >= 2, "extracted at least 2 chips");

      const chipKinds = res.body.chips.map((c) => c.kind);
      assert.ok(chipKinds.includes("type"), "extracted type chip");
      assert.ok(chipKinds.includes("bedrooms"), "extracted bedrooms chip");
      assert.ok(chipKinds.includes("maxPrice"), "extracted maxPrice chip");

      assert.ok(res.body.items.length > 0, "found matching villas under 40M with 4+ beds");
      for (const item of res.body.items) {
        assert.equal(item.propertyType, "VILLA", "extracted villa type applied");
        assert.ok(item.bedrooms >= 4, "extracted 4 beds applied");
        assert.ok(BigInt(item.price) <= 4000000000n, "extracted maxPrice applied");
      }
      console.log(`  ✔ Natural language extraction produced chips:`, res.body.chips.map((c) => c.label).join(", "));
      console.log(`  ✔ Results match extracted filters accurately (${res.body.items.length} items found)\n`);
    }

    // --------------------------------------------------------------------------
    // Test 5: Lexical Full-Text Search
    // --------------------------------------------------------------------------
    console.log("Test 5: Lexical Full-Text Search (tsvector)");
    {
      const res = await api("/api/v1/search/properties?q=Lake+View");
      assert.equal(res.status, 200);
      assert.ok(res.body.items.length > 0, "found matching results");
      const first = res.body.items[0];
      assert.ok(
        first.titleEn.toLowerCase().includes("lake") ||
          (first.descriptionEn && first.descriptionEn.toLowerCase().includes("lake")),
        "top result contains lexical term 'lake'"
      );
      console.log(`  ✔ Top lexical match: "${first.titleEn}"\n`);
    }

    // --------------------------------------------------------------------------
    // Test 6: Server-Side Map Clustering Aggregates (SEARCH.md §3, §8)
    // --------------------------------------------------------------------------
    console.log("Test 6: Map Clusters GET /api/v1/search/properties/clusters");
    {
      const res = await api("/api/v1/search/properties/clusters");
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.clusters), "clusters is an array");
      assert.ok(res.body.total > 0, "total count > 0");

      if (res.body.clusters.length > 0) {
        const cluster = res.body.clusters[0];
        assert.equal(typeof cluster.lat, "number", "cluster has lat");
        assert.equal(typeof cluster.lng, "number", "cluster has lng");
        assert.ok(cluster.count >= 1, "cluster count >= 1");
      }
      console.log(`  ✔ Returned ${res.body.clusters.length} spatial clusters (total: ${res.body.total})\n`);
    }

    // --------------------------------------------------------------------------
    // Test 7: Validation Error Taxonomy (RFC 9457 Problem Details)
    // --------------------------------------------------------------------------
    console.log("Test 7: Validation Error Handling (RFC 9457)");
    {
      const resLimit = await api("/api/v1/search/properties?limit=999");
      assert.equal(resLimit.status, 422, "limit > 50 rejected with 422");
      assert.equal(resLimit.body.type, "/errors/validation-failed");

      const resNegPrice = await api("/api/v1/search/properties?minPrice=-50");
      assert.equal(resNegPrice.status, 422, "negative minPrice rejected with 422");
      assert.equal(resNegPrice.body.type, "/errors/validation-failed");

      console.log("  ✔ Invalid query parameters rejected with RFC 9457 validation-failed\n");
    }

    console.log("🎉 All 7 Search Test Suites Passed Successfully!\n");
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error("❌ Search Test Suite Failed:", err);
  process.exit(1);
});
