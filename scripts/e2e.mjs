import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, rm, mkdir, cp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes } from "node:crypto";
const root = process.cwd();
const dir = await mkdtemp(path.join(tmpdir(), "connect-browser-"));
const workspace = path.join(dir, "app");
const port = process.env.E2E_PORT || "3110";
const origin = `http://localhost:${port}`;
const env = {
  ...process.env,
  NODE_ENV: "development",
  DATABASE_URL: "",
  LOCAL_DATABASE_DIR: path.join(dir, "postgres"),
  LOCAL_ASSET_DIR: path.join(dir, "media"),
  BETTER_AUTH_URL: origin,
  BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
  OWNER_EMAIL: "browser-owner@example.test",
  OWNER_PASSWORD: randomBytes(24).toString("base64url"),
  PLAYWRIGHT_BASE_URL: origin,
  NEXT_DIST_DIR: ".next",
};
let server;
try {
  // Isolate generated Next files as well as data. An existing developer server stays untouched.
  await mkdir(workspace, { recursive: true });
  for (const file of [
    "app",
    "components",
    "lib",
    "scripts",
    "db",
    "tests",
    "public",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "next-env.d.ts",
    "tsconfig.json",
    "playwright.config.ts",
  ])
    await cp(path.join(root, file), path.join(workspace, file), {
      recursive: true,
    });
  await symlink(
    path.join(root, "node_modules"),
    path.join(workspace, "node_modules"),
    "dir",
  );
  for (const task of ["db:migrate", "owner:create"]) {
    const r = spawnSync("npm", ["run", task], {
      cwd: workspace,
      env,
      stdio: "inherit",
    });
    if (r.status !== 0) throw new Error(`${task} failed`);
  }
  const logs = [];
  server = spawn("npm", ["run", "dev", "--", "--port", port, "--webpack"], {
    cwd: workspace,
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  for (const stream of [server.stdout, server.stderr])
    stream.on("data", (b) => {
      logs.push(b.toString());
      if (logs.length > 400) logs.shift();
    });
  let ready = false;
  for (let n = 0; n < 90; n++) {
    if (server.exitCode !== null) break;
    try {
      const r = await fetch(origin + "/connect/");
      await r.arrayBuffer();
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!ready)
    throw new Error("Test server did not become ready\n" + logs.join(""));
  for (const p of [
    "/admin/login/",
    "/admin/preview/",
    "/admin/dashboard/",
    "/api/admin/content/",
    "/api/auth/get-session/",
  ]) {
    const r = await fetch(origin + p);
    await r.arrayBuffer();
  }
  const child = spawn("npx", ["playwright", "test", ...process.argv.slice(2)], {
    cwd: workspace,
    env,
    stdio: "inherit",
  });
  const status = await new Promise((resolve) =>
    child.on("exit", (code) => resolve(code ?? 1)),
  );
  await mkdir(path.join(root, "artifacts/admin"), { recursive: true });
  await writeFile(
    path.join(root, "artifacts/admin/test-server.log"),
    logs.join(""),
  );
  for (const [from, to] of [
    [".impeccable/review", ".impeccable/review"],
    ["artifacts/admin", "artifacts/admin"],
    ["artifacts", "artifacts/cms-verification"],
    ...(status !== 0 ? [["test-results", "artifacts/admin/test-results"]] : []),
  ]) {
    try {
      await cp(path.join(workspace, from), path.join(root, to), {
        recursive: true,
      });
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  process.exitCode = status;
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  if (server && server.exitCode === null) {
    const stopped = new Promise((r) => server.once("exit", r));
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
    await Promise.race([stopped, new Promise((r) => setTimeout(r, 3000))]);
    if (server.exitCode === null) {
      try {
        process.kill(-server.pid, "SIGKILL");
      } catch {}
    }
  }
  await rm(dir, { recursive: true, force: true });
}
