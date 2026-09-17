# Phase 10: Production Hardening, Performance & Deployment

> **⚠️ Non-authoritative (Decision #48, 2026-09-17).** V1 order and scope are defined by
> `../process/ROADMAP.md` and `../process/IMPLEMENTATION_PLAN.md`. This file is kept as a screen
> inventory and progress record; where it disagrees with those documents or with
> `../DECISIONS.md`, they win. Its "luxury / escrow" framing is superseded by #45 and #47.


> **Status**: ⬜ Not Started  
> **Milestone**: Security Audits, Cache Components Optimization, CI/CD & Multi-Stage Docker  
> **Governing Specifications**: `docs/architecture/SECURITY.md`, `docs/architecture/INFRASTRUCTURE.md`  

---

## 1. Phase Goal
Harden application security, optimize rendering performance using Next.js 15 Cache Components and Partial Prefetching, package multi-stage production Docker containers, and establish automated CI/CD deployment pipelines.

---

## 2. Scope Breakdown

### Frontend Optimization
- Adopt Next.js 15 Cache Components and Partial Prefetching across high-traffic public catalog routes.
- Cross-device responsive QA (mobile 390px, tablet 768px, desktop 1440px+).
- WCAG 2.1 AA accessibility audit.

### Backend Hardening
- Helmet security headers, Content Security Policy (CSP), strict CORS origins.
- Rate limiting via Redis (`express-rate-limit` with Redis store): 100 req/min general, 5 req/min auth.
- Structured health check telemetry (`/health/liveness`, `/health/readiness`).

### Database & Infrastructure
- Prisma connection pooling optimization with PgBouncer.
- Multi-stage production `Dockerfile` for API server and BullMQ worker.
- GitHub Actions CI/CD pipeline running boundary lint, DB tests, OpenAPI drift checks, frontend build, and automated test suite.

---

## 3. Step-by-Step Execution Plan

| Step | Step Name | Objective | Status |
|---|---|---|---|
| **10.1** | Frontend Cache Components & Prefetching | Optimize Next.js rendering for instant navigation | ⬜ Not Started |
| **10.2** | Backend Security Hardening & Rate Limiting | Add Helmet, CSP, and Redis-backed rate limiting | ⬜ Not Started |
| **10.3** | Multi-Stage Docker Production Containers | Build production containers for API and worker | ⬜ Not Started |
| **10.4** | GitHub Actions CI/CD & Automated Deployment | Wire automated testing, linting, and deployment pipeline | ⬜ Not Started |
