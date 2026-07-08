import { HotUpdaterConsole } from "@hot-updater/console";

import { consoleApiClient } from "@/lib/console-api";

export function ConsoleRoute() {
  return <HotUpdaterConsole api={consoleApiClient} />;
}
