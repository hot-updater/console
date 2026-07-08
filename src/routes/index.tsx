import { createFileRoute } from "@tanstack/react-router";

import { ConsoleRoute } from "@/ConsoleRoute";

export const Route = createFileRoute("/")({
  component: ConsoleRoute,
});
