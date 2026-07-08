import { HotUpdaterConsole } from "@hot-updater/console";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { consoleApiClient } from "@/lib/console-api";

type AuthMode = "sign-in" | "sign-up";

export function ConsoleRoute() {
  const {
    data: session,
    isPending: sessionPending,
    refetch,
  } = authClient.useSession();
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitPending, setSubmitPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitPending(true);

    const result =
      authMode === "sign-up"
        ? await authClient.signUp.email({
            email,
            name: name || email,
            password,
          })
        : await authClient.signIn.email({
            email,
            password,
          });

    setSubmitPending(false);

    if (result.error) {
      setErrorMessage(result.error.message ?? "Authentication failed.");
      return;
    }

    await refetch();
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    await refetch();
  };

  if (sessionPending) {
    return (
      <main className="console-auth-shell">
        <section className="console-auth-panel" aria-busy="true">
          <div className="console-auth-heading">
            <h1>Hot Updater Console</h1>
            <p>Checking your console session.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!session) {
    const isSignUp = authMode === "sign-up";

    return (
      <main className="console-auth-shell">
        <section className="console-auth-panel">
          <div className="console-auth-heading">
            <h1>Hot Updater Console</h1>
            <p>
              Sign in with the Better Auth account stored in the dedicated
              console auth database.
            </p>
          </div>

          <form className="console-auth-form" onSubmit={handleSubmit}>
            {isSignUp ? (
              <div className="console-auth-field">
                <label htmlFor="console-auth-name">Name</label>
                <input
                  autoComplete="name"
                  id="console-auth-name"
                  onChange={(event) => setName(event.currentTarget.value)}
                  type="text"
                  value={name}
                />
              </div>
            ) : null}

            <div className="console-auth-field">
              <label htmlFor="console-auth-email">Email</label>
              <input
                autoComplete="email"
                id="console-auth-email"
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
                type="email"
                value={email}
              />
            </div>

            <div className="console-auth-field">
              <label htmlFor="console-auth-password">Password</label>
              <input
                autoComplete={isSignUp ? "new-password" : "current-password"}
                id="console-auth-password"
                minLength={8}
                onChange={(event) => setPassword(event.currentTarget.value)}
                required
                type="password"
                value={password}
              />
            </div>

            {errorMessage ? (
              <p className="console-auth-error" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              className="console-auth-button"
              disabled={submitPending}
              type="submit"
            >
              {submitPending
                ? "Working"
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="console-auth-switch">
            {isSignUp ? "Already have an account?" : "Need the first account?"}{" "}
            <button
              className="console-auth-link"
              onClick={() => {
                setErrorMessage(null);
                setAuthMode(isSignUp ? "sign-in" : "sign-up");
              }}
              type="button"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </section>
      </main>
    );
  }

  return (
    <>
      <div className="console-session-bar">
        <p className="console-session-email">{session.user.email}</p>
        <button
          className="console-session-button"
          onClick={handleSignOut}
          type="button"
        >
          Sign out
        </button>
      </div>
      <HotUpdaterConsole api={consoleApiClient} />
    </>
  );
}
