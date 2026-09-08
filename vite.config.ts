import { hotUpdaterConsole } from "@hot-updater/console/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [hotUpdaterConsole()],
  // Worker modules cannot resolve the CommonJS React imports left by SSR.
  ssr: {
    noExternal: ["react", "react-dom", "use-sync-external-store"],
  },
});
