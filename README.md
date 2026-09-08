# Hot Updater Console

Host the full Hot Updater management console on your own infrastructure using
**Nitro**. Choose a Node server, container, Vercel, Netlify, Cloudflare Workers,
or another compatible Nitro deployment target. The backend's database and
storage plugins are configured separately from the console's hosting preset.

This repository hosts the published `@hot-updater/console@1.0.0-rc.7` package.
It does not fork the UI or require a running local CLI. Bundles, Insights,
Distribution, and events use your existing Hot Updater backend.

## Deploy

Follow the [Console deployment guide](docs/console-deployment/README.md) to connect
backend plugins, configure OAuth, choose a Nitro preset, deploy, and verify.

```bash
git clone https://github.com/hot-updater/console.git my-app-console
cd my-app-console
corepack enable
pnpm install --frozen-lockfile
# Configure hot-updater.config.ts and server runtime variables first.
pnpm build:node
pnpm start
```

For another host, set `NITRO_PRESET=<preset>` on `pnpm build` and follow its
[Nitro deployment instructions](https://nitro.build/deploy). The console requires
a server; a static-only deployment cannot handle authentication or management
operations. Provider plugins must support the runtime you choose.

## Repository layout

| File                         | Responsibility                                                    |
| ---------------------------- | ----------------------------------------------------------------- |
| `vite.config.ts`             | Loads the packaged console and Nitro through its Vite plugin      |
| `hot-updater.config.ts`      | Connect your existing database and storage plugins                |
| `console.auth.ts`            | Google/GitHub OAuth, encrypted sessions, verified-email allowlist |
| `.env.example`               | Shared server authentication variables for local development      |
| `examples/cloudflare/`       | Optional D1/R2 provider config and Wrangler deployment example    |
| `docs/console-deployment/README.md` | Nitro deployment guide and Cloudflare worked example              |
| `docs/prd-hosted-console.md` | Scope, acceptance criteria, and Modex dogfood record              |

## Authentication

Only exact verified addresses in `HOT_UPDATER_CONSOLE_ALLOWED_EMAILS` can
manage the backend. OAuth state and 24-hour sessions use encrypted cookies,
without a separate auth database. Every protected read, write, and download
checks access before initializing backend plugins. Keep server credentials and
mobile signing private keys out of browser code and version control.

## Verification

```bash
pnpm test
pnpm test:type
pnpm build:node
pnpm test:node
```

CI also builds Vercel, Netlify, and Cloudflare outputs. Runtime smoke checks
start the actual built Node server or Worker with test-only credentials and
verify sign-in rendering plus denied anonymous reads, writes, and downloads.
The [Cloudflare example](docs/console-deployment/cloudflare.md)
is used for Modex dogfood; the PRD records its remote verification status.
