# Cloudflare Workers console example

Connect existing D1 and R2 resources through native Worker bindings.

Follow the [Cloudflare deployment steps](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/cloudflare.mdx) to copy the config, set bindings and secrets, and deploy.

The config builds the database and storage from the Worker's D1 and R2 bindings, and lists the plugins the managed Cloudflare server runs. `plugins` from `@hot-updater/cloudflare/worker` is that server's set: Insights and API keys. The console shows each feature only when its plugin is listed.

To host the same Cloudflare backend on Vercel, Netlify, Docker, or Node, use [Cloudflare on Node](../cloudflare-node/) instead.
