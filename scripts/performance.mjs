import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const target = process.argv[2];
if (!target)
  throw new Error(
    "Usage: npm run perf -- <production-build URL> [output directory]",
  );
const url = new URL(target).href;
const output = path.resolve(process.argv[3] || ".data/performance");
await mkdir(output, { recursive: true });
// Warm the server/database without populating the fresh browser's HTTP cache.
const warmup = await fetch(url);
if (!warmup.ok) throw new Error(`Warmup returned ${warmup.status}`);
await warmup.arrayBuffer();
const results = [];
for (const device of ["mobile", "desktop"]) {
  for (let run = 1; run <= 3; run++) {
    // A new browser process/profile prevents extensions and shared browser cache.
    const chrome = await launch({
      chromePath: process.env.CHROME_PATH || chromium.executablePath(),
      chromeFlags: ["--headless=new", "--disable-extensions", "--no-sandbox"],
    });
    try {
      const mobile = device === "mobile";
      const result = await lighthouse(
        url,
        { port: chrome.port, logLevel: "error", output: ["json", "html"] },
        {
          extends: "lighthouse:default",
          settings: {
            formFactor: device,
            onlyCategories: [
              "performance",
              "accessibility",
              "best-practices",
              "seo",
            ],
            throttlingMethod: "simulate",
            screenEmulation: {
              mobile,
              width: mobile ? 412 : 1440,
              height: mobile ? 823 : 900,
              deviceScaleFactor: mobile ? 1.75 : 1,
              disabled: false,
            },
            throttling: mobile
              ? {
                  rttMs: 150,
                  throughputKbps: 1638.4,
                  requestLatencyMs: 562.5,
                  downloadThroughputKbps: 1474.56,
                  uploadThroughputKbps: 675,
                  cpuSlowdownMultiplier: 4,
                }
              : {
                  rttMs: 40,
                  throughputKbps: 10240,
                  requestLatencyMs: 0,
                  downloadThroughputKbps: 0,
                  uploadThroughputKbps: 0,
                  cpuSlowdownMultiplier: 1,
                },
          },
        },
      );
      if (!result || result.lhr.runtimeError)
        throw new Error(JSON.stringify(result?.lhr.runtimeError));
      const stem = path.join(output, `${device}-${run}`);
      await writeFile(`${stem}.json`, result.report[0]);
      await writeFile(`${stem}.html`, result.report[1]);
      const trace = result.artifacts.Trace;
      if (trace) await writeFile(`${stem}.trace.json`, JSON.stringify(trace));
      const lhr = result.lhr;
      for (const key of [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
        "server-response-time",
      ]) {
        if (!Number.isFinite(lhr.audits[key]?.numericValue))
          throw new Error(`Incomplete Lighthouse run: ${key}`);
      }
      if (
        Object.values(lhr.categories).some(
          (category) => !Number.isFinite(category.score),
        )
      )
        throw new Error("Incomplete Lighthouse category scores");
      const metrics = Object.fromEntries(
        [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "server-response-time",
        ].map((key) => [key, lhr.audits[key]?.numericValue]),
      );
      const scripts = lhr.audits["network-requests"].details.items.filter(
        (item) => item.resourceType === "Script",
      );
      const row = {
        device,
        run,
        lighthouseVersion: lhr.lighthouseVersion,
        warnings: lhr.runWarnings,
        scores: Object.fromEntries(
          Object.entries(lhr.categories).map(([key, value]) => [
            key,
            Math.round(value.score * 100),
          ]),
        ),
        ...metrics,
        scriptTransferBytes: scripts.reduce(
          (sum, item) => sum + (item.transferSize || 0),
          0,
        ),
      };
      results.push(row);
      console.log(JSON.stringify(row));
    } finally {
      await chrome.kill();
    }
  }
}
function median(values) {
  return [...values].sort((a, b) => a - b)[1];
}
const medians = Object.fromEntries(
  ["mobile", "desktop"].map((device) => {
    const runs = results.filter((row) => row.device === device);
    return [
      device,
      {
        scores: Object.fromEntries(
          Object.keys(runs[0].scores).map((key) => [
            key,
            median(runs.map((row) => row.scores[key])),
          ]),
        ),
        ...Object.fromEntries(
          [
            "first-contentful-paint",
            "largest-contentful-paint",
            "total-blocking-time",
            "cumulative-layout-shift",
            "server-response-time",
            "scriptTransferBytes",
          ].map((key) => [key, median(runs.map((row) => row[key] ?? 0))]),
        ),
      },
    ];
  }),
);
await writeFile(
  path.join(output, "summary.json"),
  JSON.stringify(
    { url, measuredAt: new Date().toISOString(), results, medians },
    null,
    2,
  ) + "\n",
);
console.log("Medians", JSON.stringify(medians));
