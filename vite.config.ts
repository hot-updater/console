import { hotUpdaterConsole } from "@hot-updater/console/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [hotUpdaterConsole()],
  // Bundle Worker dependencies together to keep a single React SSR instance.
  ssr: {
    noExternal: process.env.NITRO_PRESET?.startsWith("cloudflare")
      ? true
      : undefined,
  },
});
