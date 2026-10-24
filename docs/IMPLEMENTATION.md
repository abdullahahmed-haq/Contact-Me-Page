# CMS implementation plan

1. Preserve the approved public components; extend their validated configuration for all editable bilingual copy, themes, cards, media, QR, contact details and visibility.
2. Add PostgreSQL/Drizzle persistence, a single atomic draft/published snapshot, immutable revisions, assets, audit records and aggregate analytics. Use filesystem-backed PGlite only for local development.
3. Add Better Auth owner-only password authentication, database sessions, CSRF/origin checks, rate limiting, secure provisioning and recovery. Authorize every admin API independently.
4. Build a responsive bilingual admin workspace, content editors and live previews that render the actual public components. Add validated image processing and S3-compatible storage.
5. Execute unit, database integration, browser and production-build checks. Document configuration, ownership, deployment, backups and operational boundaries.

Public identity: preserve the cream canvas, pastel cards, original asset positions, typography and bottom sheets. Admin uses a quiet sidebar, compact actions, generous form groups, one-column mobile editing, and a separate shared-component preview. No generated imagery is needed; the existing approved assets remain authoritative. AI generation is available in the development tools but is not exposed as a dashboard service.
