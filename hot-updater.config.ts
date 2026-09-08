import { defineConsoleConfig } from "@hot-updater/console";

// Connect the existing backend with plugins compatible with your Nitro runtime.
// See docs/console-deployment/README.md and examples/cloudflare/.
export default defineConsoleConfig(() => {
  throw new Error(
    "Configure the Hot Updater database and storage plugins before running the console.",
  );
});
