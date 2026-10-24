# Performance verification — 24 October 2026

Implemented on `perf/mobile-loading`, based on commit `65770fd0d9388be4972f5c9cbc453da1f44c29eb`. All measurements below use local **production builds** of the original and updated source, the same temporary PostgreSQL database, and a snapshot of the published public content. The improved version was subsequently [released to production](PRODUCTION.md#performance-release--24-october-2026) and verified without changing CMS content. These lab scores are not production measurements.

## Results

Each cell is the median of three fresh-browser runs. Metrics are independently medianed, so a row need not describe one individual run.

| Metric | Mobile before | Mobile after | Desktop before | Desktop after |
| --- | ---: | ---: | ---: | ---: |
| Performance | 92 | **96** | 99 | **100** |
| Accessibility | 100 | **100** | 100 | **100** |
| Best practices | 96 | **100** | 96 | **100** |
| SEO | 100 | **100** | 100 | **100** |
| FCP | 1.070 s | 1.071 s | 0.302 s | 0.298 s |
| LCP | 3.061 s | **2.733 s** | 0.967 s | **0.629 s** |
| Total blocking time | 158 ms | **98 ms** | 0 ms | **0 ms** |
| CLS | 0 | **0** | 0 | **0** |
| Warm server response | 47 ms | 57 ms | 47 ms | 42 ms |
| Navigation JavaScript transfer | 239,050 B | **187,116 B** | 239,050 B | **187,116 B** |

Initial navigation JavaScript transfer fell **21.7%** (233.4 to 182.7 KiB). The mobile avatar request fell from approximately 54.8 KiB to 5.7 KiB at the tested pixel density. The targets for performance, blocking time, layout stability and the other score categories were met. **The mobile LCP target of 2.5 s remains unmet by 233 ms.** These are lab measurements, not real-user INP or production guarantees.

The supplied `des01`/`mob1` reports scored 100/78. Those are retained as historical context, not treated as a matched before/after experiment: their screen emulation was disabled, while this comparison uses explicit viewports. An earlier exploratory cold-server run and the first uncached-server-QR candidate are also excluded from the final comparison. Their summaries remain under `.data/perf-run/`.

## What changed

- The public page renders its existing content immediately. Dialogs, composers and Motion load only on interaction intent or opening. Pointer hover, focus and pointer down prewarm the module. It stays mounted after first use, preserving the existing spring, exit and drag behavior. Loading supports cancellation, duplicate-click protection, localized status/error messages, retry and focus restoration; analytics records successful opens once.
- Published QR PNGs are generated on the server and passed through an optional internal `initialQR` prop containing a complete URL/color key. Card and dialog reuse that image. Preview changes and SVG export load the generator on demand. The bounded process cache holds at most 16 derived PNG keys, shares concurrent work and drops failures; it does not persist data or cache published content. Changing the URL or either color selects a new key. Browser preview generation has a separate bounded cache.
- PNG download decodes the existing data URL into a Blob directly; it no longer fetches `data:` under a `connect-src 'self'` policy. PNG/SVG downloads, empty states and invalid destinations remain supported.
- Raster images use responsive Next image optimization for curated local assets, local media, the exact current Blob path and the configured public S3 prefix. Public image bases are embedded at build time; rebuild when changing `S3_PUBLIC_URL`. Other previously accepted external sources retain direct image rendering. Curated SVG remains direct, eager and high priority. Image geometry, crop, CSS entrance animations, timing and fonts are unchanged.
- Page and metadata share the published-content query **within one render request** through React cache. A new request still reads current published data. There is no persistent content cache, new endpoint, content schema migration or framework upgrade.
- A 2 KiB fallback favicon derived from the existing curated avatar removes the original local `/favicon.ico` 404. A configured CMS favicon remains the explicit page icon.

## Verification

- TypeScript check, production build, 11 unit tests and 8 database integration tests passed.
- All 12 distinct isolated browser scenarios passed, combining the full regression run with a targeted owner-CMS rerun after synchronizing the save test against the completed PUT response. Browser verification covers existing CMS publishing, media, private drafts, public routes, bilingual responsive layouts, message handoff, vCard, keyboard focus, scrolling, touch drag and reduced motion; new cases cover delayed/canceled/failed dialog loading, retries, duplicate analytics, preview URL/color changes, responsive raster previews and actual PNG/SVG downloads under CSP.
- The two loading/retry cases also passed against the production preview, not just the isolated development test server.
- Batched screenshots and DOM measurements for English/Arabic at 412 and 1440 px found identical element geometry and computed animation settings before/after, with no horizontal overflow or page errors. Candidate navigation scripts contained neither Motion's projection implementation nor the QR renderer, while both were present before. Public QR was already available before interaction.

## Remaining LCP work and diagnostic limits

The final mobile `mobile-2.json` trace identifies the profile **H1** as the LCP candidate and a **148 ms** long task attributed to `744-…js`, the Next runtime chunk. The unused-JavaScript diagnostic estimates approximately 81 KiB across framework/shared code, including the chunk that contains the language dropdown and image helpers. These observations do not prove that removing any particular dependency would recover the remaining 233 ms.

Lighthouse 13.5.0 logged internal `LanternError: NO_LCP` messages for some secondary insight computations. All reported navigation runs still returned finite FCP/LCP/TBT/CLS values and category scores, with no top-level runtime error; some LCP insight panels are unavailable. Raw-trace render-delay values are not directly interchangeable with the simulated slow-network LCP metric.

Before extending the change, profile the H1/font/render path and hydration with applied throttling on a representative Android device. Then evaluate deferring the language-menu implementation or earlier delivery of the existing font **only if the trace attributes the delay to them**, while preserving keyboard behavior and all animations. No such additional UI/font change is included here.

## Reproduce and review

Use a production build with its normal database configuration, not `next dev`:

```sh
npm run build
npm run start
npm run perf -- http://localhost:3000/ .data/performance
```

The runner pins Lighthouse **13.5.0**, uses Playwright Chromium **156**, and starts a new extension-free browser process/profile for each run. It warms the server through an HTML request without warming the browser HTTP cache. Mobile is **412×823**, DPR **1.75**, 150 ms RTT, 1638.4 Kbps and 4× CPU slowdown; desktop is **1440×900**, DPR **1**, 40 ms RTT, 10240 Kbps and 1× CPU. Both enable screen emulation and use simulated throttling. Builds, tests and other audits were not run in parallel with the final measurements.

- [Machine-readable results](../artifacts/performance/summary.json)
- [Bundle and layout inspection](../artifacts/performance/bundle-and-layout-check.json)
- [Validation results](../artifacts/performance/verification.json)
- [Production release verification](../artifacts/performance/production-release.json)
- Local HTML/JSON reports and six traces per version: `.data/perf-run/final-before/` and `.data/perf-run/final-after/`.
- Local screenshot comparison: `.data/perf-run/screens/comparison.png`.
- Local production preview: <http://127.0.0.1:3121/>. It uses a separate temporary database with the public snapshot; the published release is at <https://connect.abdo-ahmed.online/>.
