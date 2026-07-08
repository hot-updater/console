# Hot Updater Console

Deployable Vite/Nitro shell for `@hot-updater/console`.

## Deployment Flow

Clone this repository into the deployment project. The console application lives
here; the reusable UI/API surface comes from `@hot-updater/console`.

```bash
git clone https://github.com/hot-updater/console
cd console
corepack enable
pnpm install
```

Configure `hot-updater.config.ts` before building. The checked-in file is
intentionally fail-closed: replace the placeholder `storage` and `database`
plugins with the same Hot Updater plugins used by your OTA deployment. Provider
plugins are passed through this file; the console package does not load provider
config on its own.

```typescript
import { s3Database, s3Storage } from "@hot-updater/aws";
import type { HotUpdaterConsoleConfig } from "@hot-updater/console/hosted";

export default {
  console: {},
  storage: s3Storage({ bucketName: process.env.HOT_UPDATER_BUCKET! }),
  database: s3Database({ bucketName: process.env.HOT_UPDATER_BUCKET! }),
} satisfies HotUpdaterConsoleConfig;
```

Install any provider packages referenced by the config and set their credentials
in the deployment environment. Do not commit credentials.

Configure Better Auth with a dedicated auth database that is separate from the
Hot Updater bundle database:

```text
AUTH_DB: Cloudflare D1 binding or equivalent Better Auth database
BETTER_AUTH_SECRET: long random secret
BETTER_AUTH_URL: deployed origin, for example https://console.example.com
BETTER_AUTH_TRUSTED_ORIGINS: comma-separated extra origins, optional
CONSOLE_AUTH_SIGN_UP_ENABLED: set to true only while bootstrapping accounts, optional
CONSOLE_AUTH_MIGRATION_SECRET: one-time migration secret, optional
```

Run locally:

```bash
pnpm dev
```

Build the Nitro server:

```bash
pnpm build
```

Start the built server:

```bash
pnpm start
```

## Nitro Deployment

Use a Node-compatible hosting target with these commands:

```text
Install command: corepack enable && pnpm install --frozen-lockfile
Build command:   pnpm build
Start command:   pnpm start
```

`pnpm build` runs Vite with the Nitro plugin and writes the deployable server to
`.output/server/index.mjs`. `pnpm start` runs that Nitro output directly.

Set runtime environment variables for every value used by
`hot-updater.config.ts`, such as storage buckets, database URLs, provider
credentials, and signing key paths. Nitro's Node runtime usually reads `PORT`;
set `NITRO_PORT` as well if your host requires it.

## Cloudflare Pages

Cloudflare Pages is supported through Nitro's `cloudflare_pages` preset. The
auth database must be a dedicated D1 binding named `AUTH_DB`; do not reuse the
Hot Updater bundle database for Better Auth tables.

Create the auth database:

```bash
pnpm dlx wrangler d1 create hot-updater-console-auth
cp wrangler.toml.example wrangler.toml
```

Replace the `database_id` in `wrangler.toml`. After the first deploy, run the
Better Auth migration endpoint once with a temporary
`CONSOLE_AUTH_MIGRATION_SECRET` environment variable:

```bash
curl -X POST \
  -H "x-console-migration-secret: $CONSOLE_AUTH_MIGRATION_SECRET" \
  https://console.example.com/api/console-auth/migrate
```

Remove `CONSOLE_AUTH_MIGRATION_SECRET` after the migration succeeds. The route
returns 404 when the secret is not configured.

Build for Pages:

```bash
NITRO_PRESET=cloudflare_pages pnpm build
```

Deploy the generated Pages output:

```bash
pnpm dlx wrangler pages deploy dist
```

In the Cloudflare Pages project, set the build output directory to
`dist`, bind the D1 database as `AUTH_DB`, and set the Better Auth and Hot
Updater provider environment variables. The example uses `nodejs_compat`
because TanStack Start and Better Auth import Node built-ins supported by the
Cloudflare runtime. Nitro still emits a Pages worker under `dist`.

## Access Control

The console includes a Better Auth email/password gate and protects every
console API server function with the active session. Public sign-up is disabled
by default. Temporarily set `CONSOLE_AUTH_SIGN_UP_ENABLED=true` only when you
need to bootstrap an account, then remove it again. You can still place the
deployment behind SSO, VPN, IP allowlist, or an identity-aware reverse proxy for
defense in depth. Keep OTA provider credentials in the runtime environment and
avoid committing secrets.
