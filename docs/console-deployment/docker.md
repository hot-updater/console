# Docker

Complete [Basics](README.md) with Node-compatible plugins first. You also need Docker.

## 1. Prepare runtime variables

```bash
cp .env.example .env.production
chmod 600 .env.production
```

Fill `.env.production` with the [authentication variables](README.md#3-set-up-sign-in) and the backend variables used by your plugins. Use plain `KEY=value` entries without wrapping quotes.

Set `BETTER_AUTH_URL` to your public HTTPS origin and register its OAuth callback. For local testing, use `http://localhost:3000` and a matching callback.

## 2. Build the image

Use the repository's included `Dockerfile` and `.dockerignore`:

```bash
docker build -t hot-updater-console:local .
```

The image builds the Node server and runs the complete `.output` as a non-root user. Secrets are supplied at startup.

The Dockerfile uses `pnpm-lock.yaml`. If you add plugins, use pnpm as declared in `package.json` to update that lockfile before building.

## 3. Start the container

```bash
docker run -d \
  --name hot-updater-console \
  --restart unless-stopped \
  --env-file .env.production \
  -p 127.0.0.1:3000:3000 \
  hot-updater-console:local
```

Open `http://localhost:3000`: you should see the sign-in page.

## 4. Connect HTTPS and verify

Point your host's HTTPS reverse proxy at `127.0.0.1:3000`, preserving the original host and scheme. Then open the public URL and follow [Verify the deployment](README.md#5-verify-the-deployment).

For a managed container service, supply the same variables through its runtime secret settings. The server listens on `0.0.0.0` and accepts the platform's `PORT` value.

<details>
<summary>Build inputs and credentials</summary>

Keep `.gitignore` in the `.dockerignore` allowlist: Tailwind uses it to exclude generated files during both client and server builds. Add explicit paths if your config imports other local modules.

Use an attached service identity where available. If Firebase needs a credential JSON file, mount it read-only, allow the container's `node` user to read it, and set `GOOGLE_APPLICATION_CREDENTIALS` to its container path.

</details>
<details>
<summary>AWS, Google Cloud, and CPU architecture</summary>

The same image can run on ECS/Fargate or Cloud Run. Use an [ECS task role](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-iam-roles.html) for AWS credentials or a [Cloud Run service identity](https://docs.cloud.google.com/run/docs/securing/service-identity) for Firebase Admin.

Build for the target CPU. Cloud Run requires [linux/amd64](https://docs.cloud.google.com/run/docs/container-contract):

```bash
docker build --platform linux/amd64 -t hot-updater-console:local .
```

Push the image to a registry your container service can access.

</details>
<details>
<summary>Logs and updates</summary>

```bash
docker logs --tail 100 hot-updater-console
```

If your proxy runs in Docker, use a shared Docker network to reach the console instead of host loopback.

For updates, build a versioned image and recreate the container with the same runtime settings. Keep the previous image for rollback; restoring it does not restore backend data.

</details>

See [Nitro's Node guide](https://nitro.build/deploy/runtimes/node) and [Docker's run reference](https://docs.docker.com/engine/containers/run/).
