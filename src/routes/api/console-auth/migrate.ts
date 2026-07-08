import { getMigrations } from "better-auth/db/migration";
import { createFileRoute } from "@tanstack/react-router";

import {
  getAuthForRequest,
  getConsoleRuntimeEnv,
} from "@/lib/auth.server";

export const Route = createFileRoute("/api/console-auth/migrate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const env = getConsoleRuntimeEnv(request);
        const migrationSecret = env.CONSOLE_AUTH_MIGRATION_SECRET;

        if (!migrationSecret) {
          return new Response("Not Found", { status: 404 });
        }

        if (
          request.headers.get("x-console-migration-secret") !==
          migrationSecret
        ) {
          return new Response("Unauthorized", { status: 401 });
        }

        const auth = getAuthForRequest(request);
        const { runMigrations, toBeAdded, toBeCreated } =
          await getMigrations(auth.options);

        await runMigrations();

        return Response.json({
          success: true,
          toBeAdded,
          toBeCreated,
        });
      },
    },
  },
});
