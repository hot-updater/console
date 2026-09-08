# Cloudflare on Node console example

Connect your existing D1 API + R2 S3 backend from a Nitro Node host: Vercel, Netlify, Docker, or a Node server.

## 1. Install and copy

From the console repository root (Node.js 22+, npm 11+):

```bash
npm install --save-exact @hot-updater/cloudflare@rc
cp examples/cloudflare-node/hot-updater.config.ts.example hot-updater.config.ts
cp .env.example .env
cat examples/cloudflare-node/.env.example >> .env
```

If `.env` already exists, merge the example values into it instead of replacing it.

## 2. Configure

Fill in the backend values in `.env` and the shared [sign-in settings](https://hot-updater.dev/docs/guides/console-deployment#set-up-sign-in). On a hosted deployment, add the same variables to the host's runtime settings.

Use a Cloudflare API token for D1 and separate R2 S3 credentials for storage. Native Worker bindings are not used by this example. For a Worker deployment, use [the bindings example](../cloudflare/) instead.

Reuse your existing backend. If it uses a custom storage `basePath`, copy that setting into the storage plugin as well.

## 3. Run or deploy

```bash
npm run test:type
npm run dev
```

Choose a [deployment host](https://hot-updater.dev/docs/guides/console-deployment#choose-a-host), then verify sign-in, your data, and a real bundle download.
