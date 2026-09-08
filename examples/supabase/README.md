# Supabase console example

Connect your existing Postgres + Storage backend from a Nitro Node host: Vercel, Netlify, Docker, or a Node server.

## 1. Install and copy

From the console repository root (Node.js 22+, npm 11+):

```bash
npm install --save-exact @hot-updater/supabase@rc
cp examples/supabase/hot-updater.config.ts.example hot-updater.config.ts
cp .env.example .env
cat examples/supabase/.env.example >> .env
```

If `.env` already exists, merge the example values into it instead of replacing it.

## 2. Configure

Fill in the backend values in `.env` and the shared [sign-in settings](../../docs/console-deployment/README.md#3-set-up-sign-in). On a hosted deployment, add the same variables to the host's runtime settings.

Use the existing project URL, bucket name, and server-only service-role key. The anon key cannot manage the backend.

Reuse your existing backend. If it uses a custom storage `basePath`, copy that setting into the storage plugin as well.

## 3. Run or deploy

```bash
npm run test:type
npm run dev
```

Choose a [deployment host](../../docs/console-deployment/README.md#4-choose-a-host), then verify sign-in, your data, and a real bundle download.
