# Firebase console example

Connect your existing Firestore + Cloud Storage backend from a Nitro Node host: Vercel, Netlify, Docker, or a Node server.

## 1. Install and copy

From the console repository root (Node.js 22+, npm 11+):

```bash
npm install --save-exact @hot-updater/firebase@rc firebase-admin firebase-functions
cp examples/firebase/hot-updater.config.ts.example hot-updater.config.ts
cp .env.example .env
cat examples/firebase/.env.example >> .env
```

If `.env` already exists, merge the example values into it instead of replacing it.

## 2. Configure

Fill in the backend values in `.env` and the shared [sign-in settings](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/index.mdx#set-up-sign-in). On a hosted deployment, add the same variables to the host's runtime settings.

Use Application Default Credentials with a service identity or mounted private file. On Vercel or Netlify, set `FIREBASE_SERVICE_ACCOUNT_JSON` to the service-account JSON in the private runtime environment store. The example supports both paths; do not commit the JSON. See [Firebase Admin setup](https://firebase.google.com/docs/admin/setup).

Reuse your existing backend. If it uses a custom storage `basePath`, copy that setting into the storage plugin as well.

## 3. Run or deploy

```bash
npm run test:type
npm run dev
```

Choose a [deployment host](https://github.com/gronxb/hot-updater/blob/next/docs/content/docs/%28latest%29/guides/console-deployment/index.mdx#choose-a-host), then verify sign-in, your data, and a real bundle download.
