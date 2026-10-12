#!/usr/bin/env node
// Bumps the pinned Hot Updater packages to a published version.
// Usage: node scripts/bump-hot-updater.mjs [version]
// Without a version, uses the npm `latest` dist-tag of @hot-updater/console.
// Prints `changed=true|false` and `version=<v>` (also to $GITHUB_OUTPUT).
import { appendFileSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const REGISTRY = (process.env.NPM_REGISTRY ?? "https://registry.npmjs.org").replace(/\/$/, "");
const PINNED = {
  dependencies: ["@hot-updater/console", "@hot-updater/server"],
  devDependencies: ["@hot-updater/cloudflare"],
};
const SCOPE = "@hot-updater/";

async function fetchJson(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      if (attempt >= 3) throw new Error(`GET ${url} failed: ${error.message}`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

const manifest = (name, version) =>
  fetchJson(`${REGISTRY}/${name.replace("/", "%2F")}/${encodeURIComponent(version)}`);

async function resolveTarget(arg) {
  if (arg) return arg.replace(/^v/, "");
  const tags = await fetchJson(`${REGISTRY}/-/package/${SCOPE}console/dist-tags`);
  if (!tags?.latest) throw new Error("Could not read the latest dist-tag of @hot-updater/console");
  return tags.latest;
}

// Every @hot-updater/* package (name@version) reachable from the pinned packages.
async function hotUpdaterClosure(version) {
  const seen = new Map();
  const queue = Object.values(PINNED).flat().map((name) => [name, version]);
  while (queue.length) {
    const [name, ver] = queue.shift();
    const key = `${name}@${ver}`;
    if (seen.has(key)) continue;
    const pkg = await manifest(name, ver);
    if (!pkg) throw new Error(`${key} is not published`);
    seen.set(key, true);
    for (const [dep, range] of Object.entries({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
      if (!dep.startsWith(SCOPE)) continue;
      // Hot Updater publishes all packages in lockstep and pins them exactly.
      const depVersion = /^\d+\.\d+\.\d+(-[\w.]+)?$/.test(range) ? range : version;
      queue.push([dep, depVersion]);
    }
  }
  return [...seen.keys()].sort();
}

function walkReadmes(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walkReadmes(path, out);
    else if (entry.name === "README.md") out.push(path);
  }
  return out;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function output(values) {
  const lines = Object.entries(values).map(([k, v]) => `${k}=${v}`);
  console.log(lines.join("\n"));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
}

const target = await resolveTarget(process.argv[2]);
const pkgPath = join(root, "package.json");
const pkgText = readFileSync(pkgPath, "utf8");
const pkg = JSON.parse(pkgText);
const current = pkg.dependencies["@hot-updater/console"];

if (current === target) {
  console.error(`Already at @hot-updater/console@${target}.`);
  output({ changed: false, version: target, previous: current });
  process.exit(0);
}

const closure = await hotUpdaterClosure(target);

// package.json: exact pins.
for (const [field, names] of Object.entries(PINNED)) {
  for (const name of names) {
    if (!pkg[field]?.[name]) throw new Error(`package.json ${field} has no ${name}`);
    pkg[field][name] = target;
  }
}
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

// pnpm-workspace.yaml: release-age exclusions and the patch key.
const wsPath = join(root, "pnpm-workspace.yaml");
let ws = readFileSync(wsPath, "utf8");
const lines = ws.split("\n");
const start = lines.findIndex((l) => l.startsWith("minimumReleaseAgeExclude:"));
if (start === -1) throw new Error("pnpm-workspace.yaml has no minimumReleaseAgeExclude");
let end = start + 1;
while (end < lines.length && /^\s+- /.test(lines[end])) end++;
const others = lines.slice(start + 1, end).filter((l) => !l.includes(`'${SCOPE}`) && !l.includes(`"${SCOPE}`));
const entries = [...others, ...closure.map((spec) => `  - '${spec}'`)];
lines.splice(start + 1, end - start - 1, ...entries);
ws = lines.join("\n");

const patchDir = join(root, "patches");
const oldPatch = `patches/@hot-updater__console@${current}.patch`;
const newPatch = `patches/@hot-updater__console@${target}.patch`;
if (existsSync(join(root, oldPatch))) {
  renameSync(join(root, oldPatch), join(root, newPatch));
  ws = ws.replace(
    new RegExp(`'@hot-updater/console@${escape(current)}': ${escape(oldPatch)}`),
    `'@hot-updater/console@${target}': ${newPatch}`,
  );
} else if (existsSync(patchDir)) {
  console.error(`warning: ${oldPatch} not found; patchedDependencies left as is`);
}
writeFileSync(wsPath, ws);

// READMEs: `@hot-updater/<pkg>@<current>` and `hot-updater@<current>` mentions.
const mention = new RegExp(`((?:@hot-updater/[\\w.-]+|\\bhot-updater)@)${escape(current)}(?![\\w.-]*\\d)`, "g");
for (const file of walkReadmes(root)) {
  const text = readFileSync(file, "utf8");
  const next = text.replace(mention, `$1${target}`);
  if (next !== text) {
    writeFileSync(file, next);
    console.error(`updated ${relative(root, file)}`);
  }
}

console.error(`Bumped Hot Updater ${current} -> ${target} (${closure.length} packages excluded from release-age gate).`);
output({ changed: true, version: target, previous: current });
