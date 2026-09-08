import { defineConsoleConfig } from "@hot-updater/console";

// Connect the existing backend with plugins compatible with your Nitro runtime.
// See examples/README.md for provider configurations.
export default defineConsoleConfig(() => {
  throw new Error(
    "Configure the Hot Updater database and storage plugins before running the console.",
  );
});
