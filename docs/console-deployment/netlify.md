# Netlify

Complete [Basics](README.md) with Node-compatible plugins first.

## 1. Import your repository

Import your private console repository into Netlify. Set the console checkout as the base directory and keep the detected package manager.

## 2. Set the build

Use this build command:

```bash
npm run build
```

Set `NITRO_PRESET=netlify` for Builds and the publish directory to `dist`. Nitro generates the server functions in `.netlify/functions-internal`; deploy through Netlify's Git integration so both outputs are included.

## 3. Set runtime variables

Choose the production domain. Add the [authentication variables](README.md#3-set-up-sign-in) and your backend credentials with the **Functions** scope.

Set `BETTER_AUTH_URL` to the HTTPS origin and register the matching OAuth callback. Build-only variables are not available to the running functions.

## 4. Deploy and check

Deploy the site, open its production URL, and follow [Verify the deployment](README.md#5-verify-the-deployment).

Reload a nested Insights URL and download a real bundle to check routing and function limits.

<details>
<summary>Preview deployments and updates</summary>

Configure production and deploy-preview variables separately. Each sign-in origin needs a matching OAuth callback.

Push updates through the same Git workflow. Restore a previous Netlify deployment to roll back console code; this does not restore backend data.

</details>

See [Nitro on Netlify](https://nitro.build/deploy/providers/netlify) and [Netlify function variables](https://docs.netlify.com/build/functions/environment-variables/).
