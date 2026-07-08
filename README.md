# Hot Updater Console

Deployable Vite/Nitro shell for `@hot-updater/console`.

## Deployment Flow

Clone this repository into the deployment project:

```bash
git clone https://github.com/hot-updater/console
cd console
corepack enable
pnpm install
```

Configure `hot-updater.config.ts` before building. The checked-in file is
intentionally fail-closed: replace the placeholder `build`, `storage`, and
`database` plugins with the same Hot Updater plugins used by your OTA
deployment.

```typescript
import { s3Database, s3Storage } from "@hot-updater/aws";
import { bare } from "@hot-updater/bare";
import { defineConfig } from "hot-updater";

export default defineConfig({
  build: bare({ enableHermes: true }),
  storage: s3Storage({ bucketName: process.env.HOT_UPDATER_BUCKET! }),
  database: s3Database({ bucketName: process.env.HOT_UPDATER_BUCKET! }),
  updateStrategy: "appVersion",
});
```

Install any provider packages referenced by the config and set their credentials
in the deployment environment. Do not commit credentials.

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

## Access Control

Run the console behind your deployment platform's access boundary, such as SSO,
VPN, IP allowlist, or an identity-aware reverse proxy. Keep OTA provider
credentials in the runtime environment and avoid exposing the service publicly
without an outer access layer.
