# Post-Slice-1 Cleanup Specifications — AI Widget, Agent Privacy & Decision #102 Alignment

    Status:       IMPLEMENTED
    Last Updated: 2026-09-19
    Scope:        Cleanup step per AGENTS.md §4: public AI assistant widget, agent email privacy, Decision #102 endpoints
    Derived from: 05-final-frontend-screen-inventory.md, ../DECISIONS.md #60, #66, #77, #102, #106,
                  ../product/BUSINESS_RULES.md §2, ../process/IMPLEMENTATION_PLAN.md §7

**Authority.** This document records specifications and acceptance criteria for the cleanup step
following Slice 1 completion. Rules come from DECISIONS.md and BUSINESS_RULES.md.

---

## 0. Cleanup map

| Spec | Surface / Component | Route / Endpoint | Description |
|---|---|---|---|
| S-CLEAN-01 | Public Layout (PublicLayout) | / and all public routes | Remove fake public AI assistant floating FAB and drawer |
| S-CLEAN-02 | Public Property API & Schema | GET /api/v1/properties/* | Stop returning agent email in public property responses |
| S-CLEAN-03 | Catalog Actions & Service | POST /properties/{id}/{sell,mark-sold} | Remove agent-only offline-sale and mark-sold endpoints (#102) |

---

## S-CLEAN-01 — Public AI Assistant Widget Removal

| Field | Specification |
|---|---|
| Surface | rontend/src/app/(public)/layout.tsx affecting screens PUB-01…PUB-09 |
| Purpose | Hide the unbuilt AI assistant floating widget and dialog drawer until Phase 3 (Intelligence) |
| Behavior | <SettlyAssistantWidget /> is removed from PublicLayout. No floating action button (#settlyAiTrigger) or drawer (#settlyAiDrawer) is rendered on public pages. The underlying component file is preserved for Phase 3. |
| Homepage CTA | The homepage (PUB-01) AssistantShowcase button <Link href= /assistant> is replaced with a non-navigating preview badge (\Interactive Assistant · Arriving in Phase 3\) to prevent 404 navigation to an unbuilt route. |
| Acceptance criteria | (1) No floating assistant button or drawer renders on any public page. (2) No dead 404 links to /assistant are clickable. (3) Responsive layout and footer remain intact. |

---

## S-CLEAN-02 — Public Property Agent Email Privacy

| Field | Specification |
|---|---|
| Surface | ackend/src/modules/catalog/schema/property.schema.ts, ackend/src/modules/catalog/repository/property.repository.ts |
| Purpose | Prevent exposure of agent private email in public property details and listings |
| Behavior | PropertyAgentSummarySchema omits the email field. ormatProperty in property.repository.ts no longer maps p.agent.email. Public responses include: id, 
ame, image, licenseNumber, rokerageName, isVerified. |
| Frontend impact | Zero breakages: PropertyDetailClient.tsx does not display or reference gent.email. |
| Acceptance criteria | (1) GET /api/v1/properties/{id} and GET /api/v1/properties/slug/{slug} do not include email under gent. (2) OpenAPI contract reflects the updated schema. (3) rontend/src/api/v1.d.ts types are synchronized. |

---

## S-CLEAN-03 — Remove Agent-Only offline-sale / mark-sold Endpoints (#102)

| Field | Specification |
|---|---|
| Surface | ackend/src/modules/catalog/routes/property.routes.ts, ackend/src/modules/catalog/service/property.service.ts |
| Purpose | Enforce Decision #102: agents cannot unilaterally transition a listing to SOLD |
| Behavior | (1) Remove OpenAPI path definitions for POST /api/v1/properties/{id}/sell (P11) and POST /api/v1/properties/{id}/mark-sold (P9 agent-only). (2) Remove corresponding Express router handlers from propertyRouter. (3) Remove markSold and offlineSale functions from property.service.ts. |
| Replacement | Full sale completion requires two-party confirmation (buyer + agent) after accepted offer and deposit (Phase 2), or 30-day admin review per Decision #82. |
| Acceptance criteria | (1) Calling POST /api/v1/properties/{id}/sell or POST /api/v1/properties/{id}/mark-sold returns 404 Not Found. (2) OpenAPI spec and frontend types contain no reference to these endpoints. (3) 
pm run check:openapi-drift passes cleanly. |
