# Phase 03: Public Discovery Completion & Market Intelligence

> **Status**: ✅ Completed  
> **Milestone**: Complete Public Experience (Screens 04–09) & Market Intelligence APIs  
> **Governing Candidates**: `docs/design/candidates/settly-landing/public/`  

---

## 1. Phase Goal
Complete all remaining 6 public screens, providing institutional-grade area guides, side-by-side residence comparisons, macro market telemetry, and certified broker directories.

---

## 2. Scope Breakdown

### Frontend (Screens 04–09)
- **Screen 04 — Compare Properties (`/compare`)**: Up to 4 residences compared across pricing, EGP/m², CAD specs, amenities, and delivery dates. Ported from `docs/design/candidates/settly-landing/public/compare.html`.
- **Screen 05 — Area Directory (`/areas`)**: Corridor grid (East Cairo, West Cairo, North Coast, Red Sea) with pricing benchmarks and inventory counts. Ported from `docs/design/candidates/settly-landing/public/areas.html`.
- **Screen 06 — Area Detail Guide (`/areas/[slug]`)**: Deep-dive area guide with price history charts, master plans, top developments, and verified advisors. Ported from `docs/design/candidates/settly-landing/public/area-detail.html`.
- **Screen 07 — Market Insights (`/market-insights`)**: Telemetry dashboard with inflation, USD/EGP rates, quarterly capital appreciation, and corridor price indices. Ported from `docs/design/candidates/settly-landing/public/market-insights.html`.
- **Screen 08 — Agent Directory (`/agents`)**: Directory of licensed brokers filterable by corridor, firm, language, and transaction volume. Ported from `docs/design/candidates/settly-landing/public/agents.html`.
- **Screen 09 — Agent Public Profile (`/agents/[id]`)**: Advisor verification badge, active exclusive listings, bio, and direct inquiry trigger. Ported from `docs/design/candidates/settly-landing/public/agent-profile.html`.

### Backend APIs
- `GET /api/v1/catalog/compare?ids=...`: Aggregates specifications for 2 to 4 properties.
- `GET /api/v1/catalog/areas/:slug/insights`: Price/m² statistics, compound count, historical price trend array.
- `GET /api/v1/analytics/market-pulse`: Macro metrics (USD/EGP, average appreciation rate, quarterly volume).
- `GET /api/v1/identity/agents`: Filtered, paginated list of verified advisors.
- `GET /api/v1/identity/agents/:id`: Detailed advisor profile with active listings.

### Database
- Read operations and aggregate pipelines on `Area`, `Property`, `PropertyPriceHistory`, `AgentProfile`.
- Indexes verified on `Property(areaId, status, price)`.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Files Created / Modified | Status |
|---|---|---|---|---|
| **3.1** | Public Catalog & Market Intelligence APIs | Build comparison, area stats, market pulse, and agent endpoints with Zod OpenAPI specs | `backend/src/modules/catalog/routes/compare.routes.ts`, `backend/src/modules/analytics/routes/market.routes.ts`, `backend/src/modules/identity/routes/agent-directory.routes.ts` | ✅ Completed |
| **3.2** | Screen 04: Compare Properties (`/compare`) | Port comparison matrix UI from candidate HTML | `frontend/src/app/(public)/compare/page.tsx`, `frontend/src/styles/settly/compare.css` | ✅ Completed |
| **3.3** | Screen 05: Area Directory (`/areas`) | Port corridor showcase grid from candidate HTML | `frontend/src/app/(public)/areas/page.tsx`, `frontend/src/styles/settly/areas.css`, `frontend/src/components/areas/AreaRadarMap.tsx` | ✅ Completed |
| **3.4** | Screen 06: Area Detail Guide (`/areas/[slug]`) | Port corridor deep-dive guide with price charts | `frontend/src/app/(public)/areas/[slug]/page.tsx`, `frontend/src/styles/settly/area-detail.css`, `frontend/src/components/areas/AreaDetailMap.tsx` | ✅ Completed |
| **3.5** | Screen 07: Market Insights (`/market-insights`) | Port telemetry dashboard and economic indicators | `frontend/src/app/(public)/market-insights/page.tsx`, `frontend/src/styles/settly/insights.css` | ✅ Completed |
| **3.6** | Screen 08 (Agents) & Screen 09 (Agent Profile) | Port broker directory and public verification profile | `frontend/src/app/(public)/agents/page.tsx`, `frontend/src/styles/settly/agents.css`, `frontend/src/app/(public)/agents/[id]/page.tsx`, `frontend/src/styles/settly/agent-profile.css` | ✅ Completed |
| **3.7** | Public Discovery Integration Test & Drift Gate | Automated endpoint test suite and OpenAPI drift validation | `backend/test/endpoints/discovery.test.mjs` | ✅ Completed |

---

## 4. Verification Criteria
1. Automated test suite `backend/test/endpoints/discovery.test.mjs` exits with code 0.
2. `npm --prefix backend run check:openapi-drift` passes.
3. `npm --prefix frontend run lint` passes with 0 errors.
4. `npm --prefix frontend run build` successfully compiles all 6 new public routes.
