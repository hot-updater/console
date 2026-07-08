import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicOutputDir = join(__dirname, ".output/public");

if (existsSync(publicOutputDir)) {
  cpSync(publicOutputDir, join(__dirname, "dist"), {
    force: true,
    recursive: true,
  });
}
