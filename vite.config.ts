import { hotUpdaterConsole } from "@hot-updater/console/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [hotUpdaterConsole()],
  // Keep SSR dependencies together for one React instance in standalone builds.
  ssr: {
    noExternal: true,
  },
});
