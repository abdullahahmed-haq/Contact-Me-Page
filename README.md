# Abdullah Ahmed — Personal Connect Hub & Studio

A bilingual personal contact site and an owner-only CMS built with Next.js 16 App Router, React, TypeScript, PostgreSQL, Drizzle, Better Auth, Zod, Sharp, QRCode, Motion, Lucide and S3-compatible object storage. Public content comes from an atomic published database snapshot. Edits and previews remain private until published. The approved public layout, existing illustrations, contact sheets, and Arabic/English typography are reused.

This application now requires a **Node server**. It no longer exports a static `out/` website. The old static preview script is not a CMS deployment target.

## Local setup

Use Node 22.12+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run db:migrate
```

Set `OWNER_EMAIL` in `.env.local`. Provision your own password from your terminal without putting it in source control or a command argument:

```sh
read -r -s OWNER_PASSWORD
export OWNER_PASSWORD
npm run owner:create
unset OWNER_PASSWORD
npm run dev
```

Type a unique password of 14–128 characters at the hidden prompt before pressing Enter. The command hashes it with Better Auth’s password implementation. There is no shipped owner password, default login, public registration, or production bypass. Provisioning refuses to overwrite an existing account or create another owner.

Open http://localhost:3000/connect/ and http://localhost:3000/admin/. Development uses real PostgreSQL through filesystem-backed PGlite in ignored `.data/postgres`, and stores optimized images in `.data/media`. The development signing secret is generated in `.data/auth-secret` with owner-only filesystem permissions if not explicitly configured. Stop the development server before running commands against the same embedded database; PGlite permits one process per data directory. Managed PostgreSQL has no such local restriction.

`BETTER_AUTH_URL` must match the exact origin you open in the browser. If you use another port, change that value before starting. Use `http://localhost:3000`, consistently, for local setup.

## Everyday editing

1. **Sign in** at `/admin/login` using the provisioned owner email and password. The sidebar language button switches the entire workspace between English LTR and Arabic RTL.
2. **Profile** edits names, greetings, subtitle, introduction, image, alt text, avatar background and ordered visible badges. English and Arabic are edited independently.
3. **Contact links** edits destinations, labels, curated icons, colors, actions, visibility, opening behavior and optional link sheets. Drag the handle or use up/down buttons. New cards start disabled. WhatsApp/email actions use their dedicated contact settings; ordinary links use their HTTPS destination.
4. **WhatsApp** changes the international number, composer limit, accent and bilingual sheet copy. **Quick messages** adds, edits, orders, disables and deletes suggestions. Clicking a public suggestion populates the actual composer; WhatsApp sends the message after handoff.
5. **Featured website** edits its heading, subtitle, CTA, URL, preview image, focal position, accent and visibility.
6. **Asset library** uploads validated raster images, previews/crops them to a square with adjustable focal point, searches uploads, edits alt text, copies URLs, and selects images for the avatar or website. Uploading a replacement creates a new asset so earlier revisions still work. Unused images can be deleted; images referenced by a draft, publication or revision cannot be deleted. Original project images can be restored from the relevant editor.
7. **QR code** sets a real public HTTPS destination, chooses tested high-contrast colors, previews and downloads actual PNG/SVG codes. The background stays white and the quiet zone stays four modules. Until the URL is configured, the original honest empty state remains. Only referrals with `?source=qr` are distinguishable in analytics; they are not verified scans.
8. **Digital contact** edits the vCard fields and profiles; download the draft `.vcf` to test it. Arabic is preserved in UTF-8. The public button downloads published contact details.
9. **Appearance** changes controlled colors, spacing, radius, shadows, typography, sheet surface and motion duration. Text/surface contrast is validated. Reset applies defaults to the draft. **Languages & copy** contains all editable public text and shows missing translations.
10. **Live preview** renders the real public components with unsaved edits, mobile/desktop sizing and either locale. Tap a card to preview its actual sheet. At narrow widths the preview appears above the editor; close it to return to editing. `/admin/preview` shows the saved draft and also requires authentication.
11. **Save draft** persists edits without changing the public page. **Publish** first saves current edits and atomically switches the public snapshot. Drafts and publications survive reloads and server restarts. A stale browser receives a conflict instead of silently overwriting another session’s changes. Reload the page before retrying a conflicting save.
12. **Published history** restores a prior live snapshot into the draft. Preview and publish it to roll back. **Discard draft changes** restores the current published content to the editor.
13. **SEO & sharing** edits localized metadata, public canonical URL, social images, favicon and indexing. `?lang=ar` renders Arabic sharing metadata. Admin pages are always excluded from indexing.
14. **Settings & security** changes public availability, default/available languages, public email and optional aggregate analytics. It also exports/imports validated content JSON, changes your password and lists/revokes active sessions. Imported content is a draft until saved and published. Password changes revoke other sessions.
15. **Activity log** records publications, draft changes, restores, image operations and authentication events. **Analytics** displays actual aggregate events, a date filter and an honest empty state. It is disabled by default and respects Do Not Track.

## Authentication and recovery

Better Auth uses database-backed expiring sessions in HttpOnly SameSite=Lax cookies; production cookies are Secure. A separate owner-membership table is checked on every CMS request. Public sign-up and unused auth routes are blocked. Both Better Auth and the CMS enforce same-origin mutations and persisted limits. Login has a strict 5-attempt/15-minute path bucket plus an account bucket; without a trusted proxy header it conservatively shares the path bucket across clients. Do not trust an IP header that the outside caller can set: your reverse proxy must overwrite the configured header.

Change passwords through Settings. If you lose access, stop local PGlite users if applicable and run offline recovery from the trusted server:

```sh
read -r -s OWNER_PASSWORD
export OWNER_PASSWORD
npm run owner:reset
unset OWNER_PASSWORD
```

Use the existing owner email in `OWNER_EMAIL`. Recovery updates its password, revokes all database sessions and writes an audit event. It requires trusted database/host access, not an unauthenticated website endpoint. Email recovery and MFA are not configured. The interface does not claim otherwise.

## Production configuration

See [deployment and security operations](docs/DEPLOYMENT.md) for the complete checklist. Required external dependencies are:

- Managed **PostgreSQL**, such as Neon, with `DATABASE_URL` including the provider’s TLS parameters.
- `BETTER_AUTH_URL` set to the public **HTTPS origin**, and a strong `BETTER_AUTH_SECRET` stored only in your deployment secret manager.
- Persistent **Vercel Blob** (`BLOB_STORE_ID` with Vercel OIDC, or `BLOB_READ_WRITE_TOKEN`), or an **S3-compatible bucket** with standard AWS SDK credentials/role, `S3_BUCKET`, `S3_REGION`, optional `S3_ENDPOINT`, and a public HTTPS `S3_PUBLIC_URL` prefix. Local filesystem uploads and PGlite are deliberately rejected in production.

```sh
npm ci
npm run db:migrate
# Provision the owner once, through the trusted terminal as described above.
npm run build
npm start
```

Run migrations once per release before switching traffic. Do not share `.data` between processes or use it on serverless/ephemeral production hosts. Database and storage credentials are never sent to the browser. The dashboard’s service-health screen reveals configuration status only. Content changes require no deployment: dynamic public routes and no-store APIs always use the current published snapshot.

The production project is deployed on Vercel Hobby with an independent Neon Free database and Vercel Blob. See [the production record](docs/PRODUCTION.md) for the domain, verification and free-tier limits. AI image generation is available as a development tool, but the dashboard has no configured generation provider and exposes no fake generation action. Existing approved images were retained.

## Verification

```sh
npm run typecheck
npm test
npm run test:integration
npx playwright install chromium
npm run test:e2e:isolated
npm run build
npm audit
```

The isolated browser runner copies the application into a temporary workspace, provisions a temporary database, a random owner password and separate image storage, starts a local server on port 3110, runs browser tests, and removes the temporary workspace/data afterward. It saves a JSON result report and screenshots under `artifacts/admin` and `artifacts/cms-verification`. It does not edit your development owner or database. `E2E_PORT` changes its port. `npm run test:e2e` can still target an already running server with `PLAYWRIGHT_BASE_URL`; owner tests require credentials in `OWNER_EMAIL` and `OWNER_PASSWORD` and are skipped otherwise.

Unit tests cover URL/message safety, vCard Unicode escaping/folding, validated defaults and QR decoding. Database integration tests exercise actual Better Auth credentials/cookies, owner enforcement, expiry/logout, CSRF, stale-write conflicts, draft privacy, publication/revisions, upload inspection/reference protection, analytics and limits. Browser tests exercise the actual editors and public flows. Actual run results are recorded in [verification](docs/VERIFICATION.md).

Run `npm run perf -- http://localhost:3000/ .data/performance` against a production build (`npm run build` then `npm run start`) to collect three fresh-browser Lighthouse runs per device, HTML/JSON reports, traces and median metrics. The runner uses Lighthouse 13.5.0 and Playwright's Chromium with fixed 412×823 mobile and 1440×900 desktop viewports; it warms the server without warming the browser cache. Performance changes and measured limits are recorded in [the performance report](docs/PERFORMANCE.md).

## Architecture

- `lib/config.ts`: public, strict Zod content schema and approved first-run defaults; no server secrets. `getSiteConfig()` is a pure defaults helper for old unit tests; the live site uses `getPublished()`.
- `lib/server/`: PostgreSQL/Drizzle database, Better Auth, authorization, atomic repository, bounded requests, image processing/storage. These modules are imported only by server routes, pages and CLI scripts.
- `db/migrations/`: generated versioned SQL and Drizzle journal. `npm run db:generate` creates subsequent migrations; `db:migrate` applies them and seeds once without overwriting data.
- `app/api/admin/[...path]`: independently protected typed content, publish, discard, restore, history, activity, analytics, status and asset operations. Content writes use one validated snapshot boundary instead of partially updating coupled fields.
- `app/api/auth/[...all]`: restricted Better Auth endpoints. `app/api/public/connect` returns only published public configuration. `app/api/events` records allowed aggregate events. `app/media/[id]` serves only optimized local development WebP assets.
- `components/admin/`: responsive workspace, bilingual form controls, real resource states, editors, uploads and shared preview.
- `components/connect-page.tsx`: original public UI with published configuration and configurable copy. Bottom sheets, composer, QR and vCard utilities are reused.
- `scripts/owner.ts`, `scripts/db.ts`, `scripts/e2e.mjs`: provisioning, migrations and isolated browser test runner.
- `DESIGN.md`, `PRODUCT.md`, `docs/`: visual authority, product truth and operational documentation.

The content document uses JSONB intentionally: this small single-owner page is published as a coherent unit. Users, sessions, accounts, membership, image metadata, revisions, audit events, rate-limit buckets and daily analytics use separate tables. Analytics keeps only UTC day, action and count, not visitor fingerprints. Request-rate counters are security metadata and are separate from analytics. Sessions omit IP and user-agent storage.

Existing supplied phone and GitHub/Instagram profiles are preserved. Website, portfolio, Telegram, email, LinkedIn and canonical public URL remain empty until the owner configures them. No personal destinations or usage statistics were fabricated. The illustrated avatar remains a fictional placeholder, with its original generation prompt and provenance beside the asset. Brand paths come from Simple Icons and the existing project vectors; UI icons use Lucide. SVG upload is restricted; the curated original website SVG remains available.
