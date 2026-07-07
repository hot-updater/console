# Hot Updater Console

Deployable wrapper for the packaged Hot Updater Console.

## Deployment Flow

Clone this repository into the deployment project:

```bash
git clone https://github.com/hot-updater/console
cd console
corepack enable
pnpm install
```

Configure `hot-updater.config.ts` before starting the server. The checked-in
file is intentionally fail-closed: the placeholder `build`, `storage`, and
`database` plugins throw until you replace them with the same Hot Updater
plugins used by your OTA deployment.

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

Install any provider packages referenced by the config and put provider
credentials in the deployment environment. Do not commit credentials.

Run the console locally:

```bash
pnpm start
```

The server listens on `http://localhost:3000` by default. Set the same port in
`PORT` and `NITRO_PORT` when your platform assigns one:

```bash
PORT=8080 NITRO_PORT=8080 pnpm start
```

## Deploy The Nitro Server

This repository does not build or copy console source. It installs
`@hot-updater/console` and runs the prebuilt Nitro Node server shipped by that
package through the `hot-updater-console` binary.

Use a Node-compatible hosting target with these settings:

```text
Install command: corepack enable && pnpm install --frozen-lockfile
Build command:   leave empty, or use the platform's install step only
Start command:   pnpm start
```

Set runtime environment variables for every value used by
`hot-updater.config.ts`, such as storage buckets, database URLs, provider
credentials, and signing key paths. For Nitro's Node runtime, hosts usually set
`PORT`; the server also honors `NITRO_PORT`. Set `HOST` or `NITRO_HOST` only
when your platform requires an explicit bind host.

If your deployment platform exposes a Nitro preset setting, keep this wrapper on
the Node server path. Provider-specific Nitro presets are build-time targets,
while this wrapper consumes already-built Node output from
`@hot-updater/console`.

## Access Control

Run the console behind your deployment platform's access boundary, such as SSO,
VPN, IP allowlist, or an identity-aware reverse proxy. Keep OTA provider
credentials in the runtime environment and avoid exposing the service publicly
without an outer access layer.
