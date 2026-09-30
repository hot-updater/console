import { defineConsoleConfig } from "@hot-updater/console";

// Set the database, storage, and plugins your server runs, with adapters that
// run on your Nitro runtime. See examples/README.md for provider configurations.
export default defineConsoleConfig(() => {
  throw new Error(
    "Set database, storage, and plugins in console.config.ts, as your server is configured, before running the console.",
  );
});
