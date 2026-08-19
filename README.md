# Hot Updater Console

A thin Vite and Nitro host for the full `@hot-updater/console` application. The
package owns the UI, routes, and protected server functions; this repository
owns deployment-specific Hot Updater providers and authentication settings.

## Start locally

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm dev
```

Set at least one complete Google or GitHub OAuth credential pair in `.env`.
OAuth callback URLs are:

- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/github`

GitHub Apps need read-only access to email addresses. GitHub OAuth Apps need the
`user:email` scope, which the template requests automatically.

## Runtime Hot Updater configuration

Do not move the entire React Native `hot-updater.config.ts` into this project.
Build, native platform, fingerprint, and signing-key settings do not belong in a
hosted console. Copy only the database, storage, `authorityId`, and optional
console Git URL into this repository's `hot-updater.config.ts`.

The checked-in config fails closed until providers are configured. For a Node
deployment, it can return a static runtime-only object:

```ts
import { defineConsoleConfig } from "@hot-updater/console";
import {
  supabaseDatabase,
  supabaseStorage,
} from "@hot-updater/supabase";

export default defineConsoleConfig({
  authorityId: "my-app",
  console: {
    gitUrl: "https://github.com/example/mobile-app",
  },
  database: supabaseDatabase({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseServiceRoleKey:
      process.env.HOT_UPDATER_SUPABASE_SERVICE_ROLE_KEY!,
  }),
  storage: supabaseStorage({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseServiceRoleKey:
      process.env.HOT_UPDATER_SUPABASE_SERVICE_ROLE_KEY!,
    bucketName: process.env.HOT_UPDATER_SUPABASE_BUCKET_NAME!,
  }),
});
```

Install the provider package used by your config. Provider credentials are
server-only runtime values and must not use Vite's `VITE_` prefix.

Cloudflare bindings are request-scoped, so use a config factory:

```ts
import { d1Database, r2Storage } from "@hot-updater/cloudflare/worker";
import { defineConsoleConfig } from "@hot-updater/console";

type CloudflareRequest = Request & {
  runtime?: {
    cloudflare?: {
      env?: {
        DB: D1Database;
        BUCKET: R2Bucket;
        BUCKET_NAME: string;
        STORAGE_DOWNLOAD_URL_SIGNING_KEY: string;
      };
    };
  };
};

export default defineConsoleConfig((request) => {
  const env = (request as CloudflareRequest).runtime?.cloudflare?.env;
  if (!env) throw new Error("Cloudflare bindings are unavailable.");

  return {
    authorityId: "my-app",
    database: d1Database(env.DB),
    storage: r2Storage({
      bucket: env.BUCKET,
      bucketName: env.BUCKET_NAME,
      downloadUrlSigningKey: env.STORAGE_DOWNLOAD_URL_SIGNING_KEY,
    }),
  };
});
```

## Authentication

`console.auth.ts` configures Better Auth without a database. OAuth state,
accounts, and the 24-hour JWE session are stored in encrypted cookies. There
are no auth migrations or password accounts.

Required runtime variables:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_SECRET` | At least 32 characters; rotating it invalidates existing sessions |
| `BETTER_AUTH_URL` | Canonical public origin; HTTPS is required outside localhost |
| `HOT_UPDATER_CONSOLE_ALLOWED_EMAILS` | Comma-separated full email addresses |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Optional complete Google pair |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Optional complete GitHub pair |

At least one provider pair is required. Email matching is case-normalized but
otherwise exact: domain-only entries and wildcards are rejected. A provider
must report the address as verified. Removing an address from the allowlist
blocks its existing session on the next console request.

Every console server function and bundle download authorizes before runtime
provider initialization. Route guards are used only for the sign-in experience.
Keep the deployment behind a VPN, IP allowlist, or identity-aware proxy when
your environment requires another layer of access control.

## Deploy with Nitro

Node and Cloudflare Workers are the tested presets. Other Nitro presets can be
selected with `NITRO_PRESET`, but provider packages must support that runtime.

### Node

```bash
pnpm build:node
pnpm start
```

The server entry is `.output/server/index.mjs`. Set `PORT` or `NITRO_PORT` as
required by the hosting provider, plus all authentication and Hot Updater
provider variables.

### Cloudflare Workers

```bash
cp wrangler.toml.example wrangler.toml
pnpm build:cloudflare
pnpm dlx wrangler deploy
```

Add the D1, R2, or other bindings used by `hot-updater.config.ts` to
`wrangler.toml`. Store authentication values with `wrangler secret put`; they
do not require a separate D1 database. The build uses Nitro's
`cloudflare_module` preset and emits `.output/server/index.mjs` plus public
assets under `.output/public`.

## Verification

```bash
pnpm test
pnpm test:type
pnpm build:node
pnpm build:cloudflare
```
