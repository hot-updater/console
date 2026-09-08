import { d1Database, r2Storage } from "@hot-updater/cloudflare/worker";
import { defineConsoleConfig } from "@hot-updater/console";

type CloudflareRequest = Request & {
  runtime?: { cloudflare?: { env?: Env } };
};

export default defineConsoleConfig((request) => {
  const env = (request as CloudflareRequest).runtime?.cloudflare?.env;
  if (!env) {
    throw new Error(
      "Cloudflare bindings are unavailable. Use pnpm preview:cloudflare, or configure Node-compatible providers.",
    );
  }

  return {
    database: d1Database(env.DB),
    storage: r2Storage({
      bucket: env.BUCKET,
      bucketName: env.BUCKET_NAME,
      downloadUrlSigningKey: env.STORAGE_DOWNLOAD_URL_SIGNING_KEY,
    }),
  };
});
