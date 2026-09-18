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
import "../src/modules/identity/routes/device.routes.js";
import "../src/modules/catalog/routes/compare.routes.js";
import "../src/modules/analytics/routes/market.routes.js";
import "../src/modules/identity/routes/agent-directory.routes.js";
import "../src/modules/pipeline/routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backendOpenApiPath = path.resolve(__dirname, "../docs/openapi.json");
const frontendOpenApiPath = path.resolve(__dirname, "../../frontend/src/api/openapi.json");

console.log("Checking for OpenAPI specification drift between backend Zod schemas and committed artifacts...");

const openApiDoc = generateOpenApiDocument();
const expectedJson = JSON.stringify(openApiDoc, null, 2) + "\n";

let hasDrift = false;

// 1. Check backend docs/openapi.json
if (!fs.existsSync(backendOpenApiPath)) {
  console.error(`❌ Missing committed backend OpenAPI file at: ${backendOpenApiPath}`);
  hasDrift = true;
} else {
  const backendContent = fs.readFileSync(backendOpenApiPath, "utf8");
  if (backendContent !== expectedJson) {
    console.error(`❌ Drift detected in backend OpenAPI file: ${backendOpenApiPath}`);
    hasDrift = true;
  }
}

// 2. Check frontend src/api/openapi.json
if (!fs.existsSync(frontendOpenApiPath)) {
  console.error(`❌ Missing synchronized frontend OpenAPI file at: ${frontendOpenApiPath}`);
  hasDrift = true;
} else {
  const frontendContent = fs.readFileSync(frontendOpenApiPath, "utf8");
  if (frontendContent !== expectedJson) {
    console.error(`❌ Drift detected in frontend OpenAPI file: ${frontendOpenApiPath}`);
    hasDrift = true;
  }
}

if (hasDrift) {
  console.error("\n💥 OpenAPI drift gate FAILED.");
  console.error("Run 'npm run generate:openapi' from the backend directory to regenerate and synchronize OpenAPI artifacts.\n");
  process.exit(1);
}

console.log("✅ OpenAPI drift check passed: in-memory schema matches committed backend and frontend specs identically.\n");
