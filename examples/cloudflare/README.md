# Cloudflare Workers console example

Connect existing D1 and R2 resources through native Worker bindings.

Follow the [Cloudflare deployment steps](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/cloudflare.mdx) to copy the config, set bindings and secrets, and deploy.

For local development, copy `.dev.vars.example` from this directory to `.dev.vars`
at the repository root, fill in the selected OAuth provider and at least one
email or domain allowlist, then run `pnpm cf:typegen`. Wrangler infers secret
types from that file. The config omits `secrets.required` because it filters
local variables and cannot express the choice between email/domain allowlists
or Google/GitHub credentials. The auth adapter validates these choices at runtime.

The config builds the database and storage from the Worker's D1 and R2 bindings, and lists the plugins the managed Cloudflare server runs. `apiKeys()`, `insights()`, and `remoteConfig()` are imported explicitly from `@hot-updater/server/plugins` and listed in `plugins`. The console shows each feature only when its plugin is listed.

To host the same Cloudflare backend on Vercel, Netlify, Docker, or Node, use [Cloudflare on Node](../cloudflare-node/) instead.
