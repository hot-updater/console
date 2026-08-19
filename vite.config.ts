import { hotUpdaterConsole } from "@hot-updater/console/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [hotUpdaterConsole()],
});
