# Production deployment

Created on 2026-10-24 at the owner's request, using free plans only.

- Public domain: https://connect.abdo-ahmed.online/
- Owner dashboard: https://connect.abdo-ahmed.online/admin/login/
- Alternate public URL: https://abdo-connect.vercel.app/
- Vercel project: `abdo-connect`, Hobby, Node 22, functions in `fra1`.
- GitHub source: [abdullahahmed-haq/Contact-Me-Page](https://github.com/abdullahahmed-haq/Contact-Me-Page), connected to Vercel; production branch `main`.
- Database: independent Neon `abdo-connect-db`, plan `free_v3`, Frankfurt; existing Supabase projects were not modified.
- Images: public Vercel Blob store `abdo-connect-images`, Frankfurt. Only processed public images enter this store; database records and secrets stay on the server.
- Verified application deployment: `dpl_B96TFkgstxr7QC7RSnYpXJVVsp4w`.

Cloudflare DNS in the existing `Odd Andesaurus` account has a CNAME named `connect` pointing to `df85d956cb559482.vercel-dns-017.com`, DNS only, TTL Auto. Vercel confirmed the domain is configured correctly. The other domain records and nameservers were preserved.

Production secrets are stored in Vercel, not in tracked files. The owner account was provisioned in Neon with the owner's supplied credentials. No password is kept in the Vercel runtime environment. Authentication is configured for the custom-domain Origin; the alternate Vercel address is for public-page access.

Nine production HTTP checks passed against the Vercel public alias using the configured custom-domain Origin, then passed again through the actual custom HTTPS hostname: public routes in English and Arabic; unauthorized administration; Secure HttpOnly owner sign-in; database/storage/dashboard status; CSRF rejection; actual Sharp-to-Blob WebP delivery; save/publish and stale-write rejection; stale deleted-Blob references; logout/session revocation. The temporary verification images were removed. Publication retained the approved content.

Dia also rendered the published site at the custom domain. The terminal retained an earlier negative DNS answer, so the final HTTP smoke run resolved the custom hostname explicitly to a Vercel address while retaining normal TLS certificate validation. Public resolvers and Vercel independently confirmed the new CNAME. This transport detail is recorded in the JSON report. A warm custom-domain request returned HTTP 200 with approximately 0.41 s TTFB from the current connection; this is one observation, not a latency guarantee.

Run `node scripts/production-smoke.mjs` after DNS propagation to check the actual custom-domain connection. Use an echo-disabled terminal for the password input; the script never logs credentials. Results are saved to `artifacts/admin/production-smoke-results.json`.

Pushing code to `main` triggers Vercel's native GitHub deployment integration. Secrets stay in Vercel; runtime database files, local environment files and generated CMS verification artifacts are excluded from Git. Published CMS content updates need no code release. The CLI command `npx vercel deploy --prod` remains available for deliberate manual releases. Run migrations deliberately against the Production database before schema-dependent releases. Preview environments need their own database/storage configuration before use; production secrets are not copied to them automatically.

## Free-plan boundaries

Vercel Hobby is for personal, non-commercial use and has usage caps. Neon Free scales compute to zero when idle, so the first request after inactivity can be slower. Vercel Blob Hobby has storage, transfer and operation limits; exceeding them can make storage unavailable until the allowance resets. No paid upgrade, trial, or automatic recharge was enabled. Free hosting does not include the existing domain's registration/renewal cost.

Independent backups, restore drills, physical QR/vCard device checks and sustained-load testing remain operational follow-ups. No paid backup or monitoring service was activated.

References: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Neon pricing](https://neon.com/pricing), [Vercel Blob pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing).
