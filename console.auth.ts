import type {
  ConsoleAccess,
  ConsoleAuthAdapter,
  ConsoleAuthProvider,
} from "@hot-updater/console";
import { betterAuth, type BetterAuthOptions } from "better-auth";

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

type ConsoleRuntimeEnv = {
  BETTER_AUTH_SECRET?: unknown;
  BETTER_AUTH_URL?: unknown;
  GITHUB_CLIENT_ID?: unknown;
  GITHUB_CLIENT_SECRET?: unknown;
  GOOGLE_CLIENT_ID?: unknown;
  GOOGLE_CLIENT_SECRET?: unknown;
  HOT_UPDATER_CONSOLE_ALLOWED_EMAILS?: unknown;
};

type CloudflareRequest = Request & {
  runtime?: {
    cloudflare?: {
      env?: ConsoleRuntimeEnv;
    };
  };
};

type ConsoleAuthSettings = {
  allowedEmails: ReadonlySet<string>;
  baseURL: string;
  providers: readonly ConsoleAuthProvider[];
  secret: string;
  socialProviders: NonNullable<BetterAuthOptions["socialProviders"]>;
};

type ConsoleSession = {
  user: {
    email: string;
    emailVerified: boolean;
    image?: string | null;
    name?: string | null;
  };
};

const readString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const readNodeEnv = (): ConsoleRuntimeEnv => {
  if (typeof process === "undefined") {
    return {};
  }
  return process.env;
};

export const getConsoleRuntimeEnv = (
  request: Request,
  nodeEnv: ConsoleRuntimeEnv = readNodeEnv(),
): ConsoleRuntimeEnv => ({
  ...nodeEnv,
  ...(request as CloudflareRequest).runtime?.cloudflare?.env,
});

const parseBaseURL = (value: unknown) => {
  const rawURL = readString(value);
  if (!rawURL) {
    throw new Error("BETTER_AUTH_URL is required.");
  }

  const url = new URL(rawURL);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "")
  ) {
    throw new Error("BETTER_AUTH_URL must be an origin without a path.");
  }

  const isLocalHTTP =
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  if (url.protocol !== "https:" && !isLocalHTTP) {
    throw new Error(
      "BETTER_AUTH_URL must use HTTPS outside localhost development.",
    );
  }

  return url.origin;
};

const parseAllowedEmails = (value: unknown) => {
  const emails = new Set(
    (readString(value) ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

  if (emails.size === 0) {
    throw new Error("HOT_UPDATER_CONSOLE_ALLOWED_EMAILS is required.");
  }

  for (const email of emails) {
    if (email.includes("*") || !/^[^@\s]+@[^@\s]+$/u.test(email)) {
      throw new Error(
        "HOT_UPDATER_CONSOLE_ALLOWED_EMAILS must contain full email addresses only.",
      );
    }
  }

  return emails;
};

const parseProvider = (
  env: ConsoleRuntimeEnv,
  provider: ConsoleAuthProvider,
) => {
  const prefix = provider === "google" ? "GOOGLE" : "GITHUB";
  const clientId = readString(env[`${prefix}_CLIENT_ID`]);
  const clientSecret = readString(env[`${prefix}_CLIENT_SECRET`]);

  if (Boolean(clientId) !== Boolean(clientSecret)) {
    throw new Error(
      `${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET must be configured together.`,
    );
  }

  return clientId && clientSecret ? { clientId, clientSecret } : null;
};

export const resolveConsoleAuthSettings = (
  env: ConsoleRuntimeEnv,
): ConsoleAuthSettings => {
  const secret = readString(env.BETTER_AUTH_SECRET);
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  }

  const google = parseProvider(env, "google");
  const github = parseProvider(env, "github");
  const providers: ConsoleAuthProvider[] = [];
  const socialProviders: NonNullable<BetterAuthOptions["socialProviders"]> = {};

  if (google) {
    providers.push("google");
    socialProviders.google = google;
  }
  if (github) {
    providers.push("github");
    socialProviders.github = {
      ...github,
      scope: ["user:email"],
    };
  }
  if (providers.length === 0) {
    throw new Error("Configure at least one Google or GitHub OAuth provider.");
  }

  return {
    allowedEmails: parseAllowedEmails(env.HOT_UPDATER_CONSOLE_ALLOWED_EMAILS),
    baseURL: parseBaseURL(env.BETTER_AUTH_URL),
    providers,
    secret,
    socialProviders,
  };
};

export const createBetterAuthOptions = (
  settings: ConsoleAuthSettings,
): BetterAuthOptions => ({
  account: {
    storeAccountCookie: true,
    storeStateStrategy: "cookie",
  },
  appName: "Hot Updater Console",
  basePath: "/api/auth",
  baseURL: settings.baseURL,
  secret: settings.secret,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: SESSION_MAX_AGE_SECONDS,
      refreshCache: true,
      strategy: "jwe",
    },
    expiresIn: SESSION_MAX_AGE_SECONDS,
  },
  socialProviders: settings.socialProviders,
  trustedOrigins: [settings.baseURL],
});

export const toConsoleAccess = (
  session: ConsoleSession | null,
  allowedEmails: ReadonlySet<string>,
): ConsoleAccess => {
  if (!session) {
    return { status: "unauthenticated" };
  }

  const principal = {
    email: session.user.email,
    image: session.user.image,
    name: session.user.name,
  };
  const normalizedEmail = session.user.email.trim().toLowerCase();

  if (
    session.user.emailVerified !== true ||
    !allowedEmails.has(normalizedEmail)
  ) {
    return { principal, status: "forbidden" };
  }

  return { principal, status: "authorized" };
};

const getAuth = (request: Request) => {
  const settings = resolveConsoleAuthSettings(getConsoleRuntimeEnv(request));
  return {
    auth: betterAuth(createBetterAuthOptions(settings)),
    settings,
  };
};

const consoleAuth = {
  async getAccess(request: Request) {
    const { auth, settings } = getAuth(request);
    const session = await auth.api.getSession({ headers: request.headers });
    return toConsoleAccess(session, settings.allowedEmails);
  },
  async getProviders(request: Request) {
    return resolveConsoleAuthSettings(getConsoleRuntimeEnv(request)).providers;
  },
  async handle(request: Request) {
    return getAuth(request).auth.handler(request);
  },
} satisfies ConsoleAuthAdapter;

export default consoleAuth;
