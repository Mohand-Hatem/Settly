# Settly Authoritative API Specification & Protocol Standards

> **Status**: Living API Standard  
> **Last Updated**: 2026-09-16  
> **Source Documents**: `backend/src/shared/openapi/registry.ts`, `docs/architecture/API.md`  

---

## 1. Core API Protocols & Boundaries

### A. Endpoint Separation
1. **Library-Owned Authentication**:
   - Route prefix: `/api/auth/*`
   - Governed entirely by Better Auth.
   - Handles sign-up, sign-in, session introspection, social OAuth, and sign-out.
   - Emits secure HTTP-only cookies (`settly_session`).
2. **Settly Resource APIs**:
   - Route prefix: `/api/v1/*`
   - Governed by modular Express 5 routers.
   - Enforces RFC 9457 Problem Details error responses.
   - Authenticated via session cookie or bearer token.

---

## 2. Telemetry & Correlation Tracing

Every inbound request to Settly API is tagged with an authoritative correlation ID:
- Header: `X-Request-Id`
- Value: Valid UUIDv7 (time-ordered, millisecond-precision).
- Propagation: Handled transparently across database transactions and external service calls via Node.js `AsyncLocalStorage` (`requestContext`).
- Logging: Included in every structured JSON log entry emitted by Pino.

---

## 3. RFC 9457 Problem Details Standard

All errors returned by `/api/v1/*` adhere strictly to RFC 9457:

```json
{
  "type": "/errors/validation-failed",
  "title": "Validation Failed",
  "status": 422,
  "detail": "One or more request parameters failed schema validation.",
  "instance": "/api/v1/properties?priceMin=abc",
  "requestId": "0191eb45-8f67-73d8-9db8-bc234a9e51c8",
  "errors": [
    {
      "path": "priceMin",
      "code": "invalid_type",
      "message": "Expected number, received string"
    }
  ]
}
```

### Standard Problem Types:
- `/errors/validation-failed` (422 Unprocessable Entity)
- `/errors/unauthenticated` (401 Unauthorized)
- `/errors/forbidden` (403 Forbidden)
- `/errors/not-found` (404 Not Found)
- `/errors/conflict` (409 Conflict — used for double-booking and checkout hold races)
- `/errors/internal` (500 Internal Server Error)

---

## 4. OpenAPI 3.0.3 Synchronization Workflow

Settly utilizes a code-first, single-source-of-truth Zod registry:
1. **Route Schemas**: Every route defines its request and response schemas using `z` from `src/shared/openapi/zod.ts`.
2. **Path Registration**: Every route registers itself with `registry.registerPath({...})`.
3. **Generation Command**:
   ```bash
   npm --prefix backend run generate:openapi
   ```
   Synchronizes `backend/docs/openapi.json` and `frontend/src/api/openapi.json`.
4. **Drift Detection CI Gate**:
   ```bash
   npm --prefix backend run check:openapi-drift
   ```
   Fails automated CI builds if any route definition has uncommitted schema changes.
