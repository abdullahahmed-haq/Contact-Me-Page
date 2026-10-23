# Abdullah Ahmed — Personal Connect Hub

A responsive bilingual personal contact page, built with Next.js App Router, strict TypeScript, React, Motion, Radix primitives, Lucide, Simple Icons, Zod, and QRCode. English uses self-hosted Manrope; Arabic uses self-hosted Noto Sans Arabic. Custom CSS supplies the shared design tokens.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000/connect/ (the root route serves the same page). Node.js 20.9+ is required. `npm run build` creates a static site in `out/`; serve that folder with a static host. `npm start` serves that production export with a dependency-free Node preview server; `next start` is not used for this static-export configuration.

## Configure

Edit `lib/config.ts`. `getSiteConfig()` is the validated data-access boundary; replace it with your server-backed repository when adding an admin system. Only pass public settings to client components. No API keys or backend secrets are required.

Configured from the owner’s supplied details:

- WhatsApp / phone: +201034243496
- GitHub: https://github.com/abdullahahmed-haq
- Instagram: https://www.instagram.com/abdobug_1/ (vCard profile; the six public card categories are preserved)

Website, portfolio, Telegram, email, LinkedIn and canonical public URL are intentionally empty. Missing links open their own themed sheet with an honest explanation and a disabled destination action. The email composer remains unavailable until a real address is configured. No destinations were fabricated.

Profile text, avatar, badges, featured link, cards, display order, enabled sections, theme values, vCard details and localized quick messages are typed settings. Quick-message `order` controls chip ordering. Public UI copy lives in `lib/i18n.ts`. Visual tokens are centralized in `app/globals.css`, with configuration overrides for the core theme.

### Public URL and QR

Set `NEXT_PUBLIC_CONNECT_URL` in `.env.local` to the final public HTTPS `/connect/` URL and rebuild, or set `canonicalUrl` in configuration. This is the only optional environment variable. Private preview URLs are not substitutes for a public canonical address. Until configured, the QR card explains why its code is unavailable. A configured QR has a four-module quiet zone, high contrast, and real PNG / SVG downloads. QR generation rejects localhost, common private IPs and insecure URLs.

### Language

Use the three-dot menu to switch between English and العربية. The selection persists in localStorage. The document language, direction, copy and sheet layout update together. The website illustration and decorative shapes reflect with Arabic, including the save-contact card and the sheet’s flowing corner accent. Logos and QR images remain unmirrored.

### Contact actions

Every actionable card opens a reusable, content-height bottom sheet first, including the website, all six contacts, QR, and Add to Contacts. External destinations open only from the sheet action. The sheet icon, decoration, selected chips, enabled CTA and disabled CTA follow the source card’s palette: mint, green, blue, cream, lavender, pink or dark.

The WhatsApp sheet uses the same shared component. It supports quick messages, selection feedback, editing, emoji insertion at the cursor, 500-character limit, accessible focus management, Escape / outside / close-button dismissal, handle-only downward dragging, scroll locking, short-screen internal scrolling and visual-viewport keyboard accommodation. The send action opens the configured WhatsApp conversation with URL-encoded text. Sending is completed in WhatsApp; the website never claims delivery. Email reuses the composer with a configured `mailto:` action.

Add to Contacts first shows the configured details in a blue sheet; its Download vCard action downloads the real vCard with configured phone and social profiles. UTF-8 text, escaping, CRLF line endings and octet-aware line folding are supported.

## Assets

- `public/assets/abdullah-illustrated-avatar.webp`: optimized generated avatar, 512×512. This is a fictional illustrative placeholder, not a verified likeness. The built-in Imagegen tool produced it; the exact prompt and source are recorded in the adjacent `.prompt.txt` file.
- `public/assets/website-preview.svg`: original scalable illustrative website preview, not a screenshot of a live portfolio.
- Hero accents and background shapes are original SVG / CSS geometry.
- WhatsApp, Telegram and GitHub brand paths come from Simple Icons (CC0). LinkedIn uses its recognizable brand mark as an inline vector. General interface icons use Lucide (ISC). Brand names and marks belong to their owners.

## Checks

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run dev                  # separate terminal, port 3000
npm run test:e2e
npm run build
```

All 8 unit tests and 7 browser tests pass. The browser suite checks all nine card entry points and matching action colors in both locales, and also exercises a real touch drag in mobile Chromium emulation. Detailed results are in `artifacts/verification.md`.

Unit tests cover deep-link encoding / validation, safe configuration, vCard escaping / UTF-8 folding, QR target validation, and actual QR decode. Browser tests cover English / Arabic across 320, 360, 390, 430, 768, 1024 and 1440px, language persistence, overflow, sheet focus / dismissal, scrolling, composer controls, deep-link handoff, vCard download and reduced motion. Screenshots and sample downloads are in `artifacts/`.

## Scope and limitations

No backend, admin dashboard, analytics, or real message delivery service is included. The data boundary is prepared for a future admin integration. Browser automation uses desktop Chromium with responsive viewports; physical iOS Safari / Android Chrome keyboard behavior still needs device testing. Supplied reference images guide layout and style; production omits their phone frame, status bar and availability dot. QR remains unavailable until the owner supplies a public canonical URL.

## Source map

- `app/`: root and `/connect` routes, document metadata, centralized CSS.
- `components/`: profile / cards, language menu, reusable sheet, message composer, QR card, brand icons.
- `lib/config.ts`: validated owner data and future-admin boundary.
- `lib/i18n.ts`: English and Arabic public UI copy.
- `lib/contact.ts`, `lib/qr.ts`: deep links, safe message limiting, vCard and QR utilities.
- `public/assets/`: generated avatar, exact generation prompt, original website preview SVG.
- `tests/`: unit / QR-decode tests and Playwright interaction suite.
- `scripts/serve.mjs`: production export preview.
- `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`: product truth and documented design system.
- `.env.example`, `.openai/hosting.json`, package / TypeScript / Next / Playwright files: environment, private Site identity and tooling.
