# Deployment and operations

## Service boundary

Deploy as a Node.js Next server (Node 22.12+), behind HTTPS. The earlier static `out/` export and `.openai` static hosting configuration are legacy public-site artifacts and cannot run this CMS. The live deployment uses Vercel Hobby, an independent Neon Free database, and Vercel Blob; see [the deployment record](PRODUCTION.md). Other Node-compatible hosts, managed PostgreSQL, and S3-compatible storage remain supported.

Production runtime refuses embedded PostgreSQL and local disk image uploads. The production build itself does not need database credentials because content pages are dynamic and auth initializes at request time. Runtime needs `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and persistent object storage for uploads. Vercel Blob is also supported: connect a public store to Production and supply `BLOB_STORE_ID` with Vercel OIDC, or use `BLOB_READ_WRITE_TOKEN`. S3 remains available and takes precedence when configured. Uploads are limited to 4 MiB to leave room under Vercel's request-body limit; the same raster validation and WebP processing apply to both providers.

## Release procedure

1. Create a PostgreSQL database and least-privilege application role. Set the provider-supplied TLS connection URL in deployment secrets. Do not disable certificate checks. For stricter role separation, apply migrations using a migration role and run the application with only CRUD rights on application tables.
2. Create a bucket or public image delivery prefix. Limit the application role to Get/Put/Delete under `connect/*`. Block bucket listing for anonymous clients. Configure public delivery of uploaded objects using a bucket policy or CDN. `S3_PUBLIC_URL` is a public base, not an expiring signed link. The SDK uses AWS environment credentials, workload roles or its normal credential chain. No upload credentials are exposed to clients.
3. Set `BETTER_AUTH_URL` to the exact public HTTPS origin and `BETTER_AUTH_SECRET` to a random secret of at least 32 characters. Keep `OWNER_PASSWORD` out of the long-running environment.
4. Build with `npm ci && npm run build`. Apply `npm run db:migrate` once to the target database. It creates versioned tables and seeds the supplied reference content only when the content row is missing.
5. Provision the owner once from a trusted terminal with `OWNER_EMAIL` and a temporary `OWNER_PASSWORD` environment variable. Clear the password immediately afterward. No email sender is needed for the documented offline recovery flow.
6. Start `npm start` behind the reverse proxy. Set its port via the normal Next `PORT` variable if needed. Keep a single canonical origin. Proxy headers used for client-IP rate limiting must be overwritten by the proxy, never appended from an untrusted caller. Without `TRUSTED_IP_HEADER`, authentication uses a conservative shared bucket.
7. Check `/connect/`, `/admin/login/`, unauthenticated `/api/admin/content/` (401), owner sign-in, draft save, preview, upload and publication. Verify a new browser sees the publication and never a private draft.
8. Configure real contact URLs and the canonical QR destination in the studio. Enable indexing and optional aggregate analytics according to the owner’s privacy notice and applicable consent requirements. Test a printed QR with a physical camera and import the downloaded vCard on actual iOS/Android devices.

## Security controls

- Better Auth password hashing and persisted 12-hour sessions. Secure production HttpOnly cookies; no localStorage authentication. Cookie cache is disabled so revocation and expiry check the database.
- Server-rendered admin pages and every CMS API independently verify both session and owner membership. The auth route exposes only sign-in/out, session management and password change. Public registration, OAuth linking and unused endpoints are blocked.
- State-changing routes require the configured Origin and reject cross-site fetches. Better Auth’s own origin protections remain enabled. Body reads are bounded, including streamed requests.
- Zod validates the complete configuration. HTTPS public URLs exclude embedded credentials and local/private targets. CSS is controlled by allowed colors/enumerations/ranges; no arbitrary HTML, SVG or CSS editor exists. React escapes content.
- Sharp inspects decoded formats, limits source bytes/pixels, strips metadata, auto-orients and outputs new WebP files with UUID object keys. Uploaded SVG, HTML and disguised files are rejected. Project SVGs are trusted curated source assets.
- Assets referenced by any draft, publication or revision cannot be deleted. Saving/publishing and deletion serialize on the same content lock. Replacing an image means uploading a new object and selecting it; prior versions retain their old image.
- Atomic publication keeps a complete public JSONB snapshot. Optimistic version checks protect against lost updates. Restoring history creates a draft; publication remains explicit.
- CSP restricts executable resources, frames, forms and connections to this origin; object embeds are disabled. Inline scripts/styles are allowed for Next/React hydration and dynamic tokens; CSP is defense in depth rather than the sole XSS boundary. A nonce-based stricter CSP is a future hardening option. HTTPS production adds HSTS. Admin routes send noindex and no-store headers.
- Aggregate analytics stores UTC day/action/count only; disabled by default, with no tracking cookie, IP log or fingerprint. Security limits use separate persisted buckets. Do Not Track disables client analytics. QR referrals are explicit query-parameter arrivals, not inferred scans or unique people.
- Audit records include authenticated content/media actions and security events. No secrets are displayed in service health or exported content JSON.

## Backups, recovery and retention

Enable automated encrypted database backups/PITR with the provider. Enable object-storage versioning/lifecycle backups. Keep database snapshots and image objects from compatible times; revision metadata alone cannot recreate deleted storage objects. Test restoring to a separate environment before an incident. JSON export contains public content and is useful for editing recovery but is not a substitute for database/assets backups.

For local work, stop the app and copy all of `.data/postgres`, `.data/media`, and the local signing secret together. Never copy an active embedded database. Production uses provider-native backups.

Run the maintenance command periodically to remove expired sessions, verification records and security rate-limit buckets. Daily event aggregates have no personal identifiers; configure a suitable retention period in `ANALYTICS_RETENTION_DAYS` (default 365) for maintenance. Audit events and content revisions are preserved for recovery; prune them only with a deliberate backup/retention policy. Assets referenced by retained revisions remain protected from deletion.

If credentials are compromised: run offline `owner:reset` to revoke sessions, rotate database/storage secrets as appropriate, rotate the auth secret, and inspect audit records. Changing the auth secret invalidates signed cookies but does not replace database cleanup.

## Known integration and verification limits

The live Neon PostgreSQL/TLS and Vercel Blob paths passed production smoke checks, including authentication, image processing/delivery/deletion, publication, stale writes and session revocation. The alternative S3 provider path and sustained multi-instance load remain unverified. Native phone keyboard, vCard import and physical-camera QR checks remain device checks. Optional AI generation, email recovery and MFA are not configured. Paid backup, monitoring and compute upgrades were not enabled; review provider free-plan retention and keep independent database and media backups.
