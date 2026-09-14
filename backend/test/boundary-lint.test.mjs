import { ESLint } from "eslint";
import fs from "node:fs";
import path from "node:path";

console.log("===============================================================================");
console.log("Settly Backend: Architectural Boundary Linting Verification Test");
console.log("===============================================================================\n");

async function run() {
  const eslint = new ESLint();

  // 1. Verify Clean Codebase Passes ESLint
  console.log("Step 1: Linting clean codebase...");
  const cleanResults = await eslint.lintFiles(["src/**/*.{ts,js}"]);
  const errorCount = cleanResults.reduce((sum, r) => sum + r.errorCount, 0);

  if (errorCount > 0) {
    console.error("  ❌ Clean codebase failed ESLint with errors:");
    const formatter = await eslint.loadFormatter("stylish");
    console.error(formatter.format(cleanResults));
    process.exit(1);
  }
  console.log("  ✅ Clean codebase passed ESLint with 0 boundary errors.\n");

  // 2. Test Boundary Rule 1: Cross-module repository import
  console.log("Step 2: Testing Boundary Rule 1 (Cross-module repository access forbidden)...");
  const relPath1 = "src/modules/catalog/service/breach-test-repo.ts";
  const breachFilePath1 = path.resolve(relPath1);
  fs.writeFileSync(
    breachFilePath1,
    `// Deliberate architectural violation: catalog service importing engagement repository directly
import { engagementRepository } from "../../engagement/repository/index.js";

export function brokenFn() {
  return engagementRepository.findById("test");
}
`
  );

  let caughtBreach1 = false;
  try {
    const breachResults1 = await eslint.lintFiles([relPath1]);
    const messages = breachResults1.flatMap((r) => r.messages);
    const violation = messages.find((m) =>
      m.message.includes("ARCHITECTURAL VIOLATION: Modules must call other modules only through their public service interface")
    );

    if (violation) {
      caughtBreach1 = true;
      console.log("  ✅ ESLint successfully caught and rejected cross-module repository import:");
      console.log(`     "${violation.message}"\n`);
    } else {
      console.log("  ⚠️ ESLint did not produce expected architectural violation message. Messages:", messages);
    }
  } finally {
    if (fs.existsSync(breachFilePath1)) fs.unlinkSync(breachFilePath1);
  }

  if (!caughtBreach1) {
    console.error("  ❌ Error: ESLint failed to catch cross-module repository violation!");
    process.exit(1);
  }

  // 3. Test Boundary Rule 2: Prisma imported outside repository/
  console.log("Step 3: Testing Boundary Rule 2 (Prisma imported outside repository/ forbidden)...");
  const relPath2 = "src/modules/catalog/service/breach-test-prisma.ts";
  const breachFilePath2 = path.resolve(relPath2);
  fs.writeFileSync(
    breachFilePath2,
    `// Deliberate architectural violation: Prisma imported in service layer
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
`
  );

  let caughtBreach2 = false;
  try {
    const breachResults2 = await eslint.lintFiles([relPath2]);
    const messages = breachResults2.flatMap((r) => r.messages);
    const violation = messages.find((m) =>
      m.message.includes("ARCHITECTURAL VIOLATION: Prisma may only be imported in repository/ layers")
    );

    if (violation) {
      caughtBreach2 = true;
      console.log("  ✅ ESLint successfully caught and rejected Prisma import in service layer:");
      console.log(`     "${violation.message}"\n`);
    } else {
      console.log("  ⚠️ ESLint did not produce expected architectural violation message. Messages:", messages);
    }
  } finally {
    if (fs.existsSync(breachFilePath2)) fs.unlinkSync(breachFilePath2);
  }

  if (!caughtBreach2) {
    console.error("  ❌ Error: ESLint failed to catch Prisma service-layer violation!");
    process.exit(1);
  }

  console.log("===============================================================================");
  console.log("Architectural Boundary Lint Test: ALL CHECKS PASSED ✅");
  console.log("===============================================================================\n");
}

run().catch((err) => {
  console.error("Fatal error during boundary lint testing:", err);
  process.exit(1);
});
