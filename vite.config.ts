import { hotUpdaterConsole } from "@hot-updater/console/vite";
import { defineConfig, type UserConfig } from "vite";

// firebase-admin reads files next to its sources (__dirname, gRPC protos), so
// it runs from node_modules instead of the bundle. Without Firebase, this is
// unused.
const nodeModulesDependencies = ["firebase-admin"];

// `nitro` is read by the Nitro plugin inside hotUpdaterConsole().
const config: UserConfig & { nitro: { traceDeps: string[] } } = {
  plugins: [hotUpdaterConsole()],
  // Keep SSR dependencies together for one React instance in standalone builds.
  ssr: {
    noExternal: true,
    external: nodeModulesDependencies,
  },
  // Copy the external dependencies into the standalone output.
  nitro: { traceDeps: nodeModulesDependencies },
};

export default defineConfig(config);
