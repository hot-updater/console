# Hot Updater Console

Deployable wrapper for the packaged Hot Updater Console.

## Quick Start

```bash
git clone https://github.com/hot-updater/console
cd console
corepack enable
pnpm install
pnpm start
```

The server listens on `http://localhost:3000` by default. Set `PORT` or
`NITRO_PORT` when your platform assigns a port:

```bash
PORT=8080 NITRO_PORT=8080 pnpm start
```

## Configure Hot Updater

`hot-updater.config.ts` is the project-specific Hot Updater config loaded by
the packaged console server. Replace the placeholder plugins with the same
database, storage, build, and update strategy used by your OTA deployment.

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

Install any provider packages referenced by your config and keep credentials in
the deployment environment.

## Access Control

Run the console behind your deployment platform's access boundary, such as SSO,
VPN, IP allowlist, or an identity-aware reverse proxy. Keep OTA provider
credentials in the runtime environment and avoid exposing the service publicly
without an outer access layer.
