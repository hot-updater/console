# Cloudflare Workers console example

Connect existing D1 and R2 resources through native Worker bindings.

Follow the [Cloudflare deployment steps](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/cloudflare.mdx) to copy the config, set bindings and secrets, and deploy.

The config also sets `plugins`, the server plugins the managed Cloudflare Worker runs: Insights and API keys. The console shows each feature only when its plugin is listed, so remove one your server does not run.

To host the same Cloudflare backend on Vercel, Netlify, Docker, or Node, use [Cloudflare on Node](../cloudflare-node/) instead.
