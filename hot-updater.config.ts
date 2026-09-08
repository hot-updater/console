import { defineConsoleConfig } from "@hot-updater/console";

// Connect the existing backend with plugins compatible with your Nitro runtime.
// See examples/README.md and https://hot-updater.dev/docs/guides/console-deployment.
export default defineConsoleConfig(() => {
  throw new Error(
    "Configure the Hot Updater database and storage plugins before running the console.",
  );
});
