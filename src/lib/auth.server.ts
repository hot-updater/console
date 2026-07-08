import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeaders } from "@tanstack/react-start/server";
import { betterAuth, type BetterAuthOptions } from "better-auth";

export type ConsoleRuntimeEnv = {
  AUTH_DB?: unknown;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;
  BETTER_AUTH_URL?: string;
  CONSOLE_AUTH_MIGRATION_SECRET?: string;
};

type RuntimeRequest = Request & {
  runtime?: {
    cloudflare?: {
      env?: ConsoleRuntimeEnv;
    };
  };
};

type ProcessLike = {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const getProcessEnv = (): ConsoleRuntimeEnv => {
  const env = (globalThis as typeof globalThis & ProcessLike).process?.env;
  return {
    AUTH_DB: undefined,
    BETTER_AUTH_SECRET: env?.BETTER_AUTH_SECRET,
    BETTER_AUTH_TRUSTED_ORIGINS: env?.BETTER_AUTH_TRUSTED_ORIGINS,
    BETTER_AUTH_URL: env?.BETTER_AUTH_URL,
    CONSOLE_AUTH_MIGRATION_SECRET: env?.CONSOLE_AUTH_MIGRATION_SECRET,
  };
};

const getGlobalEnv = (): ConsoleRuntimeEnv => {
  const globalScope = globalThis as typeof globalThis & {
    __env__?: ConsoleRuntimeEnv;
  };

  return globalScope.__env__ ?? {};
};

const getRequestEnv = (request?: Request): ConsoleRuntimeEnv => {
  return (request as RuntimeRequest | undefined)?.runtime?.cloudflare?.env ?? {};
};

export const getConsoleRuntimeEnv = (
  request?: Request,
  runtimeEnv: ConsoleRuntimeEnv = {},
): ConsoleRuntimeEnv => ({
  ...getProcessEnv(),
  ...getGlobalEnv(),
  ...runtimeEnv,
  ...getRequestEnv(request),
});

const splitOrigins = (value: string | undefined) => {
  return (
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
};

const getAuthBaseUrl = (env: ConsoleRuntimeEnv, request?: Request) => {
  if (env.BETTER_AUTH_URL) {
    return env.BETTER_AUTH_URL;
  }

  return request ? new URL(request.url).origin : undefined;
};

export const getAuthForRequest = (
  request?: Request,
  runtimeEnv: ConsoleRuntimeEnv = {},
) => {
  const env = getConsoleRuntimeEnv(request, runtimeEnv);

  if (!env.AUTH_DB) {
    throw new Error(
      "AUTH_DB D1 binding is required for Hot Updater Console authentication.",
    );
  }

  if (!env.BETTER_AUTH_SECRET) {
    throw new Error(
      "BETTER_AUTH_SECRET is required for Hot Updater Console authentication.",
    );
  }

  const baseURL = getAuthBaseUrl(env, request);
  const trustedOrigins = [
    ...new Set([
      ...splitOrigins(env.BETTER_AUTH_TRUSTED_ORIGINS),
      ...(baseURL ? [baseURL] : []),
    ]),
  ];

  return betterAuth({
    appName: "Hot Updater Console",
    basePath: "/api/auth",
    baseURL,
    database: env.AUTH_DB as BetterAuthOptions["database"],
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
  });
};

const readConsoleSession = async () => {
  const request = getRequest();
  const auth = getAuthForRequest(request);
  return auth.api.getSession({
    headers: getRequestHeaders(),
  });
};

export const getConsoleSession = createServerFn({ method: "GET" }).handler(
  readConsoleSession,
);

export const requireConsoleSession = async () => {
  const session = await readConsoleSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
};
