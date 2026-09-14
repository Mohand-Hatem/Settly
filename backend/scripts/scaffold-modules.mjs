import fs from "fs";
import path from "path";

const modules = [
  { name: "catalog", service: "CatalogService", entity: "Property" },
  { name: "engagement", service: "EngagementService", entity: "Favorite" },
  { name: "pipeline", service: "PipelineService", entity: "Viewing" },
  { name: "payments", service: "PaymentService", entity: "Deposit" },
  { name: "messaging", service: "MessagingService", entity: "Message" },
  { name: "notifications", service: "NotificationService", entity: "Notification" },
  { name: "knowledge", service: "KnowledgeService", entity: "Article" },
  { name: "ai", service: "AiService", entity: "AiConversation" },
  { name: "search", service: "SearchService", entity: "SearchResult" },
  { name: "analytics", service: "AnalyticsService", entity: "AuditLog" },
];

const basePath = path.resolve("backend/src/modules");

for (const mod of modules) {
  const modDir = path.join(basePath, mod.name);
  for (const sub of ["routes", "service", "repository", "sql", "events", "types"]) {
    fs.mkdirSync(path.join(modDir, sub), { recursive: true });
  }

  // routes/index.ts
  fs.writeFileSync(
    path.join(modDir, "routes", "index.ts"),
    `import { Router } from "express";

export const ${mod.name}Router: Router = Router();

${mod.name}Router.get("/health", (_req, res) => {
  res.json({ module: "${mod.name}", status: "ok" });
});
`
  );

  // types/index.ts
  fs.writeFileSync(
    path.join(modDir, "types", "index.ts"),
    `export interface ${mod.entity}Dto {
  id: string;
  createdAt: string;
}
`
  );

  // service/index.ts
  const instanceName = mod.service.charAt(0).toLowerCase() + mod.service.slice(1);
  fs.writeFileSync(
    path.join(modDir, "service", "index.ts"),
    `import type { ${mod.entity}Dto } from "../types/index.js";

export interface I${mod.service} {
  getById(id: string): Promise<${mod.entity}Dto | null>;
}

export class ${mod.service} implements I${mod.service} {
  async getById(id: string): Promise<${mod.entity}Dto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const ${instanceName} = new ${mod.service}();
`
  );

  // repository/index.ts
  const repoName = `${mod.service.replace("Service", "")}Repository`;
  const repoInstance = repoName.charAt(0).toLowerCase() + repoName.slice(1);
  fs.writeFileSync(
    path.join(modDir, "repository", "index.ts"),
    `import type { ${mod.entity}Dto } from "../types/index.js";

export class ${repoName} {
  async findById(id: string): Promise<${mod.entity}Dto | null> {
    return { id, createdAt: new Date().toISOString() };
  }
}

export const ${repoInstance} = new ${repoName}();
`
  );

  // sql/index.ts
  fs.writeFileSync(
    path.join(modDir, "sql", "index.ts"),
    `// Raw SQL queries for ${mod.name} module
export const ${mod.name.toUpperCase()}_QUERIES = {
  healthCheck: "SELECT 1 AS alive",
};
`
  );

  // events/index.ts
  fs.writeFileSync(
    path.join(modDir, "events", "index.ts"),
    `export interface ${mod.entity}CreatedEvent {
  id: string;
  timestamp: string;
}
`
  );

  // index.ts (barrel export: service, routes, events, types - NO repository, NO sql)
  fs.writeFileSync(
    path.join(modDir, "index.ts"),
    `export * from "./service/index.js";
export * from "./routes/index.js";
export * from "./events/index.js";
export * from "./types/index.js";
`
  );

  console.log(`Scaffolded module: ${mod.name}`);
}

console.log("All 11 modules successfully created.");
