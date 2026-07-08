import { createFileRoute } from "@tanstack/react-router";

import { getAuthForRequest } from "@/lib/auth.server";

const handleAuthRequest = ({ request }: { request: Request }) => {
  return getAuthForRequest(request).handler(request);
};

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuthRequest,
      POST: handleAuthRequest,
    },
  },
});
