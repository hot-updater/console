import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const runtime = process.argv[2];
assert(["node", "cloudflare"].includes(runtime), "Choose node or cloudflare.");
const secrets = {
  BETTER_AUTH_SECRET: "local-smoke-test-session-secret-at-least-32-characters",
  HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: "",
  HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS: "example.com",
  GITHUB_CLIENT_ID: "smoke-test-client",
  GITHUB_CLIENT_SECRET: "smoke-test-client-secret",
  GOOGLE_CLIENT_ID: "smoke-test-google-client",
  GOOGLE_CLIENT_SECRET: "smoke-test-google-client-secret",
};

const serverDir = new URL("../.output/server/", import.meta.url);
// The bundler decides which chunk holds the server function manifest and
// console.config.ts, so read every chunk the build wrote.
const chunks = [];
for (const name of await readdir(serverDir, { recursive: true })) {
  if (name.split(/[\\/]/).includes("node_modules") || !/\.m?js$/.test(name)) continue;
  chunks.push({ name, source: await readFile(new URL(name, serverDir), "utf8") });
}
const functions = Object.fromEntries(
  chunks.flatMap(({ source }) =>
    [...source.matchAll(/"([a-f0-9]+)":\s*\{\s*functionName: "([^"]+)"/g)].map(([, id, name]) => [
      name,
      id,
    ]),
  ),
);
assert(Object.keys(functions).length > 0, "Build the console before running this check.");
// console.config.ts loads only on a signed-in request, which this check never
// makes. Its chunk is imported directly, so a backend SDK the build cannot
// bundle fails here instead of on the first sign-in.
const configChunks = chunks
  .filter(({ source }) => source.includes("defineConsoleConfig"))
  .map(({ name }) => name);
assert(configChunks.length > 0, "The build is missing console.config.ts.");

let server;
let standaloneDirectory;
let origin = "http://localhost";
if (runtime === "cloudflare") {
  const { createTestHarness } = await import("wrangler");
  server = createTestHarness({
    workers: [
      {
        configPath: new URL("wrangler.json", serverDir),
        vars: { BETTER_AUTH_URL: "http://localhost" },
        secrets,
      },
    ],
  });
} else {
  standaloneDirectory = await mkdtemp(join(tmpdir(), "console-smoke-"));
  await cp(new URL("../", serverDir), standaloneDirectory, { recursive: true });
  const child = spawn(process.execPath, [join(standaloneDirectory, "server/index.mjs")], {
    cwd: standaloneDirectory,
    env: {
      ...process.env,
      ...secrets,
      BETTER_AUTH_URL: "http://localhost",
      PORT: "0",
      HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server = {
    listen: () =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Node server did not start.")), 30_000);
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`Node exited: ${code}`));
        });
        child.stdout.on("data", (chunk) => {
          const url = chunk.toString().match(/http:\/\/[^\s]+/);
          if (url) {
            origin = new URL(url[0]).origin;
            clearTimeout(timer);
            resolve();
          }
        });
        child.stderr.on("data", (chunk) => process.stderr.write(chunk));
      }),
    fetch: (url, init) => fetch(url.replace("http://localhost", origin), init),
    close: async () => {
      if (child.exitCode !== null) return;
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      await exited;
    },
  };
}

try {
  // The standalone copy holds only what the build traced, as a deployment does.
  if (standaloneDirectory) {
    for (const name of configChunks) {
      const chunk = pathToFileURL(join(standaloneDirectory, "server", name)).href;
      const result = spawnSync(
        process.execPath,
        ["--input-type=module", "--eval", `await import(${JSON.stringify(chunk)});`],
        { cwd: standaloneDirectory, encoding: "utf8" },
      );
      assert.equal(result.status, 0, `console.config.ts failed to load:\n${result.stderr}`);
    }
  }
  await server.listen();
  const page = await server.fetch("http://localhost/insights");
  assert.equal(page.status, 200, "The server must render, not just build.");
  const html = await page.text();
  assert.match(html, /Sign in to manage OTA bundles/);
  assert.match(html, /Continue with GitHub/);
  assert.match(html, /Continue with Google/);

  const session = await server.fetch("http://localhost/api/auth/get-session");
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);

  const download = await server.fetch("http://localhost/api/bundles/nonexistent/download");
  assert.equal(download.status, 401, "Downloads authorize before reading storage.");

  for (const [name, method] of [
    ["getChannels_createServerFn_handler", "GET"],
    ["createChannel_createServerFn_handler", "POST"],
  ]) {
    const id = functions[name];
    assert(id, `Missing server function: ${name}`);
    const response = await server.fetch(`http://localhost/_serverFn/${id}`, {
      method,
      headers: { Origin: origin },
      ...(method === "POST" ? { body: new FormData() } : {}),
    });
    assert.equal(response.status, 401, `${name}: ${await response.text()}`);
  }
  console.log(
    `${runtime} runtime: ${runtime === "node" ? "console.config.ts load, " : ""}sign-in, session, protected read/write, and download passed.`,
  );
} finally {
  await server.close();
  if (standaloneDirectory) await rm(standaloneDirectory, { recursive: true, force: true });
}
