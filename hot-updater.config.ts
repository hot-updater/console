import type { HotUpdaterConsoleConfig } from "@hot-updater/console/hosted";

const missingPlugin = (name: string): never => {
  throw new Error(
    `Configure the Hot Updater ${name} plugin before running the console.`,
  );
};

export default {
  console: {},
  storage: () => missingPlugin("storage"),
  database: () => missingPlugin("database"),
} satisfies HotUpdaterConsoleConfig;
