import { defineConsoleConfig } from "@hot-updater/console";

const missingPlugin = (name: string): never => {
  throw new Error(
    `Configure the Hot Updater ${name} plugin before running the console.`,
  );
};

export default defineConsoleConfig(() => {
  return missingPlugin("database and storage");
});
