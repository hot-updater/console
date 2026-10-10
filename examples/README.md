# Console backend examples

Choose the backend you already use, then choose a compatible Nitro host.

| Backend | Configuration | Console hosting |
| --- | --- | --- |
| [AWS](aws/) | DynamoDB + S3 | Node, Docker, Vercel, Netlify |
| [Firebase](firebase/) | Firestore + Cloud Storage | Node, Docker, Vercel, Netlify |
| [Supabase](supabase/) | Postgres + Storage | Node, Docker, Vercel, Netlify |
| [Cloudflare on Node](cloudflare-node/) | D1 API + R2 S3 credentials | Node, Docker, Vercel, Netlify |
| [Cloudflare Workers](cloudflare/) | Native D1 + R2 bindings | Cloudflare Workers |

Each Node example includes a `console.config.ts.example` to copy to `console.config.ts`, backend environment variables, and three setup steps. GitHub/Google sign-in and access rules are shared in [Basics](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/index.mdx#set-up-sign-in).

Each config lists the database, storage, and plugins the server runs, as `hot-updater.config.ts` does: managed servers run `apiKeys()`, `insights()`, and `remoteConfig()`. The examples import these factories explicitly from `@hot-updater/server/plugins` and list them in `plugins`. The console shows a feature only when its plugin is listed. To manage a self-hosted server through its admin API instead, set `database` to `standaloneRepository(...)` and list the server's plugins, as described in [Basics](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/index.mdx#connect-your-backend).

Install only your backend's packages. For the included Dockerfile, install them with the pnpm version in `package.json` and commit `pnpm-lock.yaml` before building.

CI copies each configuration into the template, checks its types, builds the console, and tests the sign-in and anonymous-access boundaries. These checks do not contact your backend; verify its credentials and permissions after deployment.
