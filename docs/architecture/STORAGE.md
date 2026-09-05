# File Storage

    Status:       LOCKED
    Last Updated: 2026-09-05
    Derived From: Decisions #25, #33, #40, #42
    Related:      API.md Section 12, SECURITY.md, RAG.md

## 1. Purpose

The storage split, the upload contract, and the security controls that make uploads safe without
a malware scanner.

## 2. The split

| Store | Contents | Access |
|---|---|---|
| **Cloudinary** | Public property images, media, avatars | Signed direct upload; served from a separate domain, never the API origin |
| **Supabase Storage** | Private documents (contracts, floor plans, authorized documents) | Settly authorization check → short-lived signed URL |

PostgreSQL remains the metadata source of truth for both. **No Supabase RLS.**

## 3. Upload contract

```
  POST /uploads/authorize   { kind, propertyId?, contentType, byteSize, filename }
        → { assetId, provider, uploadParams, constraints }
  [client uploads DIRECTLY to Cloudinary / Supabase Storage — bytes never traverse Express]
  POST /uploads/:assetId/complete   { providerRef }
        → { assetId, status: "PROCESSING" }
```

The finalize step is required for both providers — uniform contract, immediate client feedback,
and it's the moment the provider reference binds to our record. A sweeper re-checks assets stuck
in `PENDING` as a backstop against a missed webhook/callback.

## 4. Security controls

| Control | Detail |
|---|---|
| Filenames | Never used as storage keys — `{uuid}.{verified-ext}`. Original name is display-only, escaped |
| Magic bytes | **Cloudinary validates image formats server-side; Supabase Storage validates nothing** — so magic-byte verification is Settly's own responsibility on the document path, run in the worker before a document is retrievable or indexed |
| Size / dimensions | Images capped (decompression-bomb guard); documents capped at a few MB |
| **Re-encoding** | Mandatory for images — neutralises polyglot files and, non-obviously, **strips EXIF GPS data**. Never serve the original asset URL, only a transformed derivative — phone photos carry exact coordinates for listings with deliberately approximate addresses |
| Private downloads | Authorization check first, then a short-lived (~5 min) signed URL, `Content-Disposition: attachment`, and the access is **audited** |
| Serving domain | User content never served from the API origin — an uploaded SVG served from `api.settly.com` would be stored XSS with session-cookie access |
| Document extraction | Runs in the **worker, not the API** — a parser crash takes down a job, not a request |
| **Structural PDF rejection** | Reject PDFs containing `/JavaScript`, `/OpenAction`, or `/EmbeddedFile` — targeted at the real threat (a crafted PDF exploiting our extraction library), which a generic scanner would likely miss anyway |
| Resource limits | Hard wall-clock and memory ceilings per document during extraction; exceed → kill, mark `FAILED` |

## 5. Malware scanning — a deliberate, documented v1 limitation

**No ClamAV or third-party scanner.** ClamAV's detection rate against targeted/novel malware is
poor — deploying it would produce a feeling of protection larger than the protection (security
theater). The actual threat here is our own parser being exploited during extraction, addressed
directly by structural PDF rejection and resource limits above, which are more targeted than a
generic scanner for this specific risk.

## 6. Failure behaviour

Cloudinary down → existing media serves from CDN, new uploads fail cleanly, sweeper retries.
Supabase Storage down → existing signed URLs still work until expiry; new signing fails cleanly.

## 7. Embedding implications

Document text extraction feeds `RAG.md`'s ingestion pipeline — a document's `Embedding` rows are
created only after successful extraction and are kept in sync with the document's visibility
scope and lifecycle (see `RAG.md` Section 6).

## 8. Local vs. production

Cloudinary is **real** locally (`dev/` folder) — its EXIF-stripping and format validation are
controls we need to actually exercise, not fake. Supabase Storage uses a local filesystem adapter
behind the same interface locally.

## 9. Pending verification

**V15** (Supabase Storage signed-URL expiry/single-use semantics) · **V16** (Cloudinary signed
upload preset constraints — needed now, since Cloudinary is real in local dev).

## 10. Rejected / do not add

Routing file bytes through Express · ClamAV / third-party malware scanning · serving original
(un-re-encoded) images · public URLs for private documents · Supabase RLS for document access
control.

## 11. Related documents

`API.md` Section 12 for the HTTP contract · `SECURITY.md` for the broader upload-abuse and rate
limiting context · `RAG.md` for what happens to document content after ingestion.
