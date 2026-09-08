# Console backend examples

Choose the backend you already use, then choose a compatible Nitro host.

| Backend | Configuration | Console hosting |
| --- | --- | --- |
| [AWS](aws/) | DynamoDB + S3 | Node, Docker, Vercel, Netlify |
| [Firebase](firebase/) | Firestore + Cloud Storage | Node, Docker, Vercel, Netlify |
| [Supabase](supabase/) | Postgres + Storage | Node, Docker, Vercel, Netlify |
| [Cloudflare on Node](cloudflare-node/) | D1 API + R2 S3 credentials | Node, Docker, Vercel, Netlify |
| [Cloudflare Workers](cloudflare/) | Native D1 + R2 bindings | Cloudflare Workers |

Each Node example includes a config file, backend environment variables, and three setup steps. GitHub/Google sign-in and access rules are shared in [Basics](https://hot-updater.dev/docs/guides/console-deployment#set-up-sign-in).

Use only the plugins for your backend. For the included Dockerfile, install them with the pnpm version in `package.json` and commit `pnpm-lock.yaml` before building.

CI copies each configuration into the template, checks its types, builds the console, and tests the sign-in and anonymous-access boundaries. These checks do not contact your backend; verify its credentials and permissions after deployment.
