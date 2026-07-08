import { createRoute } from "@tanstack/react-router";

import { ConsoleRoute } from "./ConsoleRoute";
import { Route as rootRoute } from "./routes/__root";

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: ConsoleRoute,
});

export const routeTree = rootRoute.addChildren([indexRoute]);
