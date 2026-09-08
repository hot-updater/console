import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

import { createTestHarness } from "wrangler";

const serverDir = new URL("../.output/server/", import.meta.url);
const resolverFile = (await readdir(serverDir)).find((name) =>
  name.includes("tanstack-start-server-fn-resolver"),
);
assert(resolverFile, "Build the Cloudflare Worker before running this check.");
const resolver = await readFile(new URL(resolverFile, serverDir), "utf8");
const functions = Object.fromEntries(
  [...resolver.matchAll(/"([a-f0-9]+)":\s*\{\s*functionName: "([^"]+)"/g)].map(
    ([, id, name]) => [name, id],
  ),
);

const server = createTestHarness({
  workers: [
    {
      configPath: new URL("wrangler.json", serverDir),
      vars: { BETTER_AUTH_URL: "http://localhost" },
      secrets: {
        BETTER_AUTH_SECRET:
          "local-smoke-test-session-secret-at-least-32-characters",
        HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: "owner@example.com",
        STORAGE_DOWNLOAD_URL_SIGNING_KEY:
          "local-smoke-test-storage-key-at-least-32-characters",
        GITHUB_CLIENT_ID: "smoke-test-client",
        GITHUB_CLIENT_SECRET: "smoke-test-client-secret",
      },
    },
  ],
});

try {
  await server.listen();
  const page = await server.fetch("http://localhost/insights");
  assert.equal(page.status, 200, "The Worker must render, not just build.");
  const html = await page.text();
  assert.match(html, /Sign in to manage OTA bundles/);
  assert.match(html, /Continue with GitHub/);

  const session = await server.fetch("http://localhost/api/auth/get-session");
  assert.equal(session.status, 200);
  assert.equal(await session.json(), null);

  const download = await server.fetch(
    "http://localhost/api/bundles/nonexistent/download",
  );
  assert.equal(
    download.status,
    401,
    "Downloads authorize before reading storage.",
  );

  for (const [name, method] of [
    ["getChannels_createServerFn_handler", "GET"],
    ["createChannel_createServerFn_handler", "POST"],
  ]) {
    const id = functions[name];
    assert(id, `Missing server function: ${name}`);
    const response = await server.fetch(`http://localhost/_serverFn/${id}`, {
      method,
      headers: { Origin: "http://localhost" },
      ...(method === "POST" ? { body: new FormData() } : {}),
    });
    assert.equal(response.status, 401, `${name}: ${await response.text()}`);
  }
  console.log(
    "Worker runtime: sign-in, session, protected read/write, and download passed.",
  );
} finally {
  await server.close();
}
