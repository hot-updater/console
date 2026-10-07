import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { getCookies } from "better-auth/cookies";
import { makeSignature, symmetricEncodeJWT } from "better-auth/crypto";

import {
  createBetterAuthOptions,
  getConsoleRuntimeEnv,
  resolveConsoleAuthSettings,
  toConsoleAccess,
  default as consoleAuth,
} from "./console.auth";

const validEnv = {
  BETTER_AUTH_SECRET: "a-secure-test-secret-with-32-characters",
  BETTER_AUTH_URL: "https://console.example.com",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: "owner@example.com",
};

const createRuntimeRequest = (path = "/") => {
  const request = new Request(
    `https://console.example.com${path}`,
  ) as Request & {
    runtime: {
      cloudflare: {
        env: Record<string, unknown>;
      };
    };
  };
  request.runtime = { cloudflare: { env: validEnv } };
  return request;
};

describe("resolveConsoleAuthSettings", () => {
  it("enables complete providers and normalizes exact email addresses", () => {
    const settings = resolveConsoleAuthSettings({
      ...validEnv,
      GITHUB_CLIENT_ID: "github-client-id",
      GITHUB_CLIENT_SECRET: "github-client-secret",
      HOT_UPDATER_CONSOLE_ALLOWED_EMAILS:
        " Owner@Example.com,operator@example.com ",
    });

    expect(settings.providers).toEqual(["google", "github"]);
    expect([...settings.allowedEmails]).toEqual([
      "owner@example.com",
      "operator@example.com",
    ]);
    expect(settings.baseURL).toBe("https://console.example.com");
  });

  it.each(["google", "github"])(
    "allows domain-only configuration for %s",
    (provider) => {
      const settings = resolveConsoleAuthSettings({
        ...validEnv,
        GOOGLE_CLIENT_ID: undefined,
        GOOGLE_CLIENT_SECRET: undefined,
        [`${provider.toUpperCase()}_CLIENT_ID`]: "client-id",
        [`${provider.toUpperCase()}_CLIENT_SECRET`]: "client-secret",
        HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: undefined,
        HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS:
          " Example.com,team.example.org,EXAMPLE.COM ",
      });

      expect(settings.providers).toEqual([provider]);
      expect([...settings.allowedEmails]).toEqual([]);
      expect([...settings.allowedEmailDomains]).toEqual([
        "example.com",
        "team.example.org",
      ]);
    },
  );

  it.each([
    "@example.com",
    "*@example.com",
    "*.example.com",
    "owner@example.com",
    "https://example.com",
    "example..com",
    "-example.com",
    "example.com.",
    "example .com",
  ])("rejects invalid allowed domains: %s", (domain) => {
    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS: domain,
      }),
    ).toThrow("HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS");
  });

  it("fails closed for missing allowlists, partial providers, and no provider", () => {
    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: " , ",
        HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS: " , ",
      }),
    ).toThrow("HOT_UPDATER_CONSOLE_ALLOWED_EMAILS");

    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        GOOGLE_CLIENT_SECRET: undefined,
      }),
    ).toThrow("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");

    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        GOOGLE_CLIENT_ID: undefined,
        GOOGLE_CLIENT_SECRET: undefined,
      }),
    ).toThrow("at least one");
  });

  it("rejects wildcard allowlists and non-canonical production URLs", () => {
    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: "*@example.com",
      }),
    ).toThrow("full email addresses only");

    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        BETTER_AUTH_URL: "https://console.example.com/path",
      }),
    ).toThrow("origin without a path");

    expect(() =>
      resolveConsoleAuthSettings({
        ...validEnv,
        BETTER_AUTH_URL: "http://console.example.com",
      }),
    ).toThrow("must use HTTPS");
  });

  it("creates an explicit database-free stateless configuration", () => {
    const options = createBetterAuthOptions(
      resolveConsoleAuthSettings(validEnv),
    );

    expect(options).not.toHaveProperty("database");
    expect(options).not.toHaveProperty("emailAndPassword");
    expect(options.session?.expiresIn).toBe(86_400);
    expect(options.session?.cookieCache).toMatchObject({
      enabled: true,
      maxAge: 86_400,
      refreshCache: true,
      strategy: "jwe",
      version: "2",
    });
    expect(options.trustedOrigins).toEqual(["https://console.example.com"]);
  });
});

describe("Google email verification", () => {
  it.each([
    ["owner@example.com", true, "example.com", true],
    ["owner@example.com", true, undefined, false],
    ["owner@example.com", true, "other.com", false],
    ["owner@example.com", false, "example.com", false],
    ["owner@gmail.com", true, undefined, true],
    ["owner@gmail.com", false, undefined, false],
  ])(
    "requires Google to be authoritative for %s (verified: %s, hd: %s)",
    async (email, emailVerified, hd, expected) => {
      const auth = betterAuth(
        createBetterAuthOptions(resolveConsoleAuthSettings(validEnv)),
      );
      const context = await auth.$context;
      const provider = context.socialProviders.find(({ id }) => id === "google")!;
      // Exercise profile mapping after the OAuth token exchange, without network calls.
      const payload = Buffer.from(
        JSON.stringify({
          sub: "google-user",
          name: "Test User",
          email,
          email_verified: emailVerified,
          hd,
        }),
      ).toString("base64url");
      const result = await provider.getUserInfo({
        idToken: `e30.${payload}.signature`,
      });

      expect(result?.user.emailVerified).toBe(expected);
    },
  );
});

describe("getConsoleRuntimeEnv", () => {
  it("uses Cloudflare request bindings over Node environment values", () => {
    const request = new Request("https://console.example.com") as Request & {
      runtime: {
        cloudflare: {
          env: Record<string, unknown>;
        };
      };
    };
    request.runtime = {
      cloudflare: {
        env: {
          BETTER_AUTH_SECRET: "cloudflare-secret",
          GOOGLE_CLIENT_ID: "cloudflare-client",
        },
      },
    };

    expect(
      getConsoleRuntimeEnv(request, {
        BETTER_AUTH_SECRET: "node-secret",
        GOOGLE_CLIENT_ID: "node-client",
        GOOGLE_CLIENT_SECRET: "node-client-secret",
      }),
    ).toMatchObject({
      BETTER_AUTH_SECRET: "cloudflare-secret",
      GOOGLE_CLIENT_ID: "cloudflare-client",
      GOOGLE_CLIENT_SECRET: "node-client-secret",
    });
  });
});

describe("toConsoleAccess", () => {
  const allowedEmails = new Set(["owner@example.com"]);

  it("distinguishes anonymous, forbidden, and authorized sessions", () => {
    expect(toConsoleAccess(null, allowedEmails)).toEqual({
      status: "unauthenticated",
    });

    expect(
      toConsoleAccess(
        {
          user: {
            email: "other@example.com",
            emailVerified: true,
          },
        },
        allowedEmails,
      ),
    ).toMatchObject({ status: "forbidden" });

    expect(
      toConsoleAccess(
        {
          user: {
            email: "OWNER@EXAMPLE.COM",
            emailVerified: true,
          },
        },
        allowedEmails,
      ),
    ).toMatchObject({
      principal: { email: "OWNER@EXAMPLE.COM" },
      status: "authorized",
    });
  });

  it("rejects an allowlisted address when the provider did not verify it", () => {
    expect(
      toConsoleAccess(
        {
          user: {
            email: "owner@example.com",
            emailVerified: false,
          },
        },
        allowedEmails,
      ),
    ).toMatchObject({ status: "forbidden" });
  });

  it.each([
    ["member@company.com", true, "authorized"],
    [" MEMBER@COMPANY.COM ", true, "authorized"],
    ["member@team.example.org", true, "authorized"],
    ["owner@example.com", true, "authorized"],
    ["other@example.com", true, "forbidden"],
    ["member@sub.company.com", true, "forbidden"],
    ["member@othercompany.com", true, "forbidden"],
    ["member@company.com.evil.com", true, "forbidden"],
    ["member@evil.com@company.com", true, "forbidden"],
    ["@company.com", true, "forbidden"],
    ["member@company.com", false, "forbidden"],
    ["owner@example.com", false, "forbidden"],
  ])(
    "checks email and domain access for %s (verified: %s)",
    (email, emailVerified, status) => {
      const settings = resolveConsoleAuthSettings({
        ...validEnv,
        HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS:
          "company.com,team.example.org",
      });

      expect(
        toConsoleAccess(
          { user: { email, emailVerified } },
          settings.allowedEmails,
          settings.allowedEmailDomains,
        ),
      ).toMatchObject({ status });
    },
  );

  it("blocks an existing session after its domain is removed", () => {
    const session = {
      user: { email: "member@company.com", emailVerified: true },
    };
    const settings = resolveConsoleAuthSettings({
      ...validEnv,
      HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS: "company.com",
    });

    expect(
      toConsoleAccess(
        session,
        settings.allowedEmails,
        settings.allowedEmailDomains,
      ),
    ).toMatchObject({ status: "authorized" });

    const updatedSettings = resolveConsoleAuthSettings(validEnv);
    expect(
      toConsoleAccess(
        session,
        updatedSettings.allowedEmails,
        updatedSettings.allowedEmailDomains,
      ),
    ).toMatchObject({ status: "forbidden" });
  });
});

describe("consoleAuth", () => {
  it.each([
    ["1", "unauthenticated"],
    ["2", "authorized"],
  ])("checks domain-only access with session policy %s", async (version, status) => {
    const env = {
      ...validEnv,
      HOT_UPDATER_CONSOLE_ALLOWED_EMAILS: "",
      HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS: "company.com",
    };
    const request = createRuntimeRequest();
    request.runtime.cloudflare.env = env;
    const settings = resolveConsoleAuthSettings(env);
    const cookies = getCookies(createBetterAuthOptions(settings));
    const now = new Date().toISOString();
    const token = "test-session-token";
    const signature = await makeSignature(token, settings.secret);
    const sessionData = await symmetricEncodeJWT(
      {
        session: {
          id: "test-session",
          token,
          userId: "test-user",
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        },
        user: {
          id: "test-user",
          name: "Test User",
          email: "member@company.com",
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
        updatedAt: Date.now(),
        version,
      },
      settings.secret,
      "better-auth-session",
    );
    request.headers.set(
      "Cookie",
      `${cookies.sessionToken.name}=${encodeURIComponent(`${token}.${signature}`)}; ${cookies.sessionData.name}=${sessionData}`,
    );

    await expect(consoleAuth.getAccess(request)).resolves.toMatchObject({ status });
    if (version === "2") {
      env.HOT_UPDATER_CONSOLE_ALLOWED_EMAIL_DOMAINS = "other.com";
      await expect(consoleAuth.getAccess(request)).resolves.toMatchObject({
        status: "forbidden",
      });
    }
  });

  it("reports runtime-enabled providers without exposing credentials", async () => {
    await expect(
      consoleAuth.getProviders(createRuntimeRequest()),
    ).resolves.toEqual(["google"]);
  });

  it("delegates Better Auth session requests and maps an empty session", async () => {
    const request = createRuntimeRequest("/api/auth/get-session");
    const response = await consoleAuth.handle(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toBeNull();
    await expect(consoleAuth.getAccess(request)).resolves.toEqual({
      status: "unauthenticated",
    });
  });
});
