# Hot Updater Console

Host the full Hot Updater management console on your own infrastructure using
**Nitro**. Choose a Node server, container, Vercel, Netlify, Cloudflare Workers,
or another compatible Nitro deployment target. The backend's database and
storage plugins are configured separately from the console's hosting preset.

This repository hosts the published `@hot-updater/console` package.
It does not fork the UI or require a running local CLI. Bundles, Insights,
Distribution, and events use your existing Hot Updater backend.

## Deploy

Follow the [Console deployment guide](https://hot-updater.dev/docs/guides/console-deployment) to connect
backend plugins, configure OAuth, choose a Nitro preset, deploy, and verify.
Use Node.js 22+ and npm 11+ for the commands below.
Choose a host independently of your managed backend: see the
[hosting guide](https://hot-updater.dev/docs/guides/console-deployment#choose-a-host)
and the [Docker deployment guide](https://hot-updater.dev/docs/guides/console-deployment/docker).

```bash
git clone https://github.com/hot-updater/console.git my-app-console
cd my-app-console
npm install
# Configure hot-updater.config.ts and server runtime variables first.
npm run build:node
npm start
```

For another host, set `NITRO_PRESET=<preset>` on `npm run build` and follow its
[Nitro deployment instructions](https://nitro.build/deploy). The console requires
a server; a static-only deployment cannot handle authentication or management
operations. Provider plugins must support the runtime you choose.

## Repository layout

| File                         | Responsibility                                                    |
| ---------------------------- | ----------------------------------------------------------------- |
| `vite.config.ts`             | Loads the packaged console and Nitro through its Vite plugin      |
| `hot-updater.config.ts`      | Connect your existing database and storage plugins                |
| `console.auth.ts`            | Google/GitHub OAuth, encrypted sessions, verified-email allowlist |
| `.env.example`               | Shared server authentication variables for local development      |
| `examples/`                  | AWS, Firebase, Supabase, and Cloudflare backend configurations    |
| `Dockerfile` / `.dockerignore` | Standalone Node image and explicit build-context allowlist        |

Choose a [backend example](examples/README.md): AWS, Firebase, Supabase, or Cloudflare.

## Authentication

GitHub and Google sign-in are included: fill in the authentication environment
variables to enable either provider. For another authentication system,
[customize the adapter and sign-in flow](https://hot-updater.dev/docs/guides/console-deployment#custom-authentication)
in your clone.

Only exact verified addresses in `HOT_UPDATER_CONSOLE_ALLOWED_EMAILS` can
manage the backend. OAuth state and 24-hour sessions use encrypted cookies,
without a separate auth database. Every protected read, write, and download
checks access before initializing backend plugins. Keep server credentials and
mobile signing private keys out of browser code and version control.

## Verification

```bash
npm test
npm run test:type
npm run build:node
npm run test:node
```

CI also builds Vercel, Netlify, and Cloudflare outputs. Runtime smoke checks
start the actual built Node server or Worker with test-only credentials and
verify sign-in rendering plus denied anonymous reads, writes, and downloads.
