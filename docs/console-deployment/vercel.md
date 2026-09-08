# Vercel

Complete [Basics](README.md) with Node-compatible plugins first.

## 1. Import your repository

Import your private console repository, or link your local checkout:

```bash
npx vercel link
```

Use the console checkout as the root directory and keep the detected package manager.

## 2. Set the build

Select **Other** as the framework preset and Node.js 22 or later. Set this as the build command:

```bash
npm run build
```

Add `NITRO_PRESET=vercel` as a build environment variable. Nitro generates `.vercel/output`; keep the generated server functions and static assets together.

## 3. Set runtime variables

Choose the production domain. Add the [authentication variables](README.md#3-set-up-sign-in) and your backend credentials to the project's Production environment.

Set `BETTER_AUTH_URL` to that domain's HTTPS origin and register the matching OAuth callback. Use server variables, without a `VITE_` prefix.

## 4. Deploy and check

Deploy from the dashboard or your linked checkout:

```bash
npx vercel deploy --prod
```

Open the production URL and follow [Verify the deployment](README.md#5-verify-the-deployment).

Test a real-sized bundle download: the console proxies it through the function, so [Vercel's payload and execution limits](https://vercel.com/docs/functions/limitations) apply.

<details>
<summary>Preview deployments and updates</summary>

Preview URLs need matching OAuth callbacks and `BETTER_AUTH_URL`. Otherwise, use sign-in only on the production origin.

Push updates through the same Git workflow. To restore console code, promote a previous Vercel deployment; backend data is unaffected by that rollback.

</details>

See [Nitro on Vercel](https://nitro.build/deploy/providers/vercel) and [Vercel environment variables](https://vercel.com/docs/environment-variables).
