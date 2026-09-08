# Hot Updater Console

Deploy the full Hot Updater management console to your own HTTPS URL. This
repository hosts the published `@hot-updater/console` package; it does not copy
or fork the UI. Bundles, Insights, Distribution, and events use your existing
Hot Updater database and storage.

The template currently pins console **1.0.0-rc.7** and Cloudflare provider
**1.0.0-rc.5**. A running `hot-updater console` process or mobile checkout is not
needed after deployment.

## Deploy

Start with the [Console deployment guide](docs/console-deployment.md). It covers
cloning this repository, connecting an existing D1 database and R2 bucket,
configuring Google or GitHub login, deploying, and verifying the result.

```bash
git clone https://github.com/hot-updater/console.git my-app-console
cd my-app-console
corepack enable
pnpm install --frozen-lockfile
```

The default configuration targets Cloudflare Workers. Edit `wrangler.jsonc` for
your existing resources and configure authentication before deploying. The
[Node deployment section](docs/console-deployment.md#node-deployment) explains
how to replace the provider configuration for a Node host.

## Repository layout

| File | Responsibility |
| --- | --- |
| `vite.config.ts` | Loads the packaged console through its Vite plugin |
| `hot-updater.config.ts` | Creates database and storage plugins from request bindings |
| `console.auth.ts` | OAuth, encrypted sessions, verified-email allowlist |
| `wrangler.jsonc` | Worker, existing resource bindings, public settings |
| `.dev.vars.example` | Local preview secret names; copy to ignored `.dev.vars` |
| `docs/console-deployment.md` | Reproducible deployment and operations guide |
| `docs/prd-hosted-console.md` | Scope, decisions, acceptance criteria, verification |

## Authentication

Google or GitHub OAuth signs users in. Only exact, verified addresses listed in
`HOT_UPDATER_CONSOLE_ALLOWED_EMAILS` can access the console. OAuth account state
and 24-hour sessions use encrypted cookies, so there is no separate auth
database or migration. Removing an address blocks its existing session on the
next protected request.

Every console server function and bundle download checks access before
initializing providers. Keep database credentials, OAuth secrets, and signing
private keys out of browser code and version control. The hosted console does
not need a mobile bundle-signing private key.

## Development and verification

```bash
pnpm test
pnpm test:type
pnpm build:cloudflare
pnpm exec wrangler deploy --dry-run
pnpm test:cloudflare
```

The Worker smoke check runs the built artifact locally with test-only OAuth
settings and verifies the sign-in page plus protected reads, writes, and
downloads. It does not contact an OAuth provider or production resources.

For a Worker preview, configure `.dev.vars`, then run `pnpm preview:cloudflare`.
Wrangler uses local D1 and R2 by default; this does not copy production data.
For Node-compatible providers, configure `.env` and use `pnpm dev`.

The [PRD](docs/prd-hosted-console.md) records the real Modex deployment check.
