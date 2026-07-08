import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const config = defineConfig({
  plugins: [
    nitro({
      compatibilityDate: "2026-07-08",
    }),
    tanstackStart(),
    viteReact(),
  ],
  assetsInclude: ["**/*.node"],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: ["oxc-transform", "@oxc-transform/binding-darwin-arm64"],
  },
  ssr: {
    noExternal: ["@hot-updater/console", "@hot-updater/core"],
    external: [
      "@hot-updater/bsdiff",
      "@hot-updater/cli-tools",
      "oxc-transform",
      "@oxc-transform/binding-darwin-arm64",
      "@oxc-transform/binding-wasm32-wasi",
    ],
  },
  build: {
    rollupOptions: {
      external: [
        "@hot-updater/bsdiff",
        "@hot-updater/cli-tools",
        "oxc-transform",
        "@oxc-transform/binding-darwin-arm64",
        "@oxc-transform/binding-wasm32-wasi",
      ],
    },
  },
});

export default config;
