import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateOpenApiDocument } from "../src/shared/openapi/registry.js";

// Ensure all route definitions are registered
import "../src/modules/catalog/routes/area.routes.js";
import "../src/modules/catalog/routes/property.routes.js";
import "../src/modules/catalog/routes/amenity.routes.js";
import "../src/modules/catalog/routes/upload.routes.js";
import "../src/modules/identity/routes/profile.routes.js";
import "../src/modules/identity/routes/admin-agent.routes.js";
import "../src/modules/identity/routes/admin-stats.routes.js";
import "../src/modules/identity/routes/device.routes.js";
import "../src/modules/catalog/routes/compare.routes.js";
import "../src/modules/analytics/routes/market.routes.js";
import "../src/modules/identity/routes/agent-directory.routes.js";
import "../src/modules/pipeline/routes/index.js";
import "../src/modules/pipeline/routes/offer.routes.js";
import "../src/modules/payments/routes/payment.routes.js";
import "../src/modules/messaging/routes/conversation.routes.js";
import "../src/modules/notifications/routes/notification.routes.js";
import "../src/modules/search/routes/index.js";
import "../src/modules/knowledge/routes/index.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendDocsDir = path.resolve(__dirname, "../docs");
const frontendApiDir = path.resolve(__dirname, "../../frontend/src/api");

const backendOpenApiPath = path.join(backendDocsDir, "openapi.json");
const frontendOpenApiPath = path.join(frontendApiDir, "openapi.json");

console.log("Generating OpenAPI 3.0.3 specification from backend Zod registry...");
const openApiDoc = generateOpenApiDocument();
const serializedJson = JSON.stringify(openApiDoc, null, 2) + "\n";

// 1. Write backend/docs/openapi.json
if (!fs.existsSync(backendDocsDir)) {
  fs.mkdirSync(backendDocsDir, { recursive: true });
}
fs.writeFileSync(backendOpenApiPath, serializedJson, "utf8");
console.log(`✅ Saved backend OpenAPI spec to: ${backendOpenApiPath}`);

// 2. Write frontend/src/api/openapi.json
if (!fs.existsSync(frontendApiDir)) {
  fs.mkdirSync(frontendApiDir, { recursive: true });
}
fs.writeFileSync(frontendOpenApiPath, serializedJson, "utf8");
console.log(`✅ Synchronized frontend OpenAPI spec to: ${frontendOpenApiPath}`);

console.log(`OpenAPI specification generation completed successfully with ${Object.keys(openApiDoc.paths || {}).length} registered paths.`);
