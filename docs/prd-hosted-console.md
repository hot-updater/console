# Hosted Console: Nitro deployment and Modex dogfood

Status: implementation in progress

## Problem

`hot-updater console` serves the management UI from a developer's computer.
Teams need a persistent HTTPS console that remains available when that computer
is offline. The standalone repository currently pins a temporary preview build,
and its deployment instructions need a reproducible path from clone to a hosted app.

## Outcome

A developer can clone `hot-updater/console`, configure their existing Hot Updater
backend and OAuth access, and deploy the same console through a compatible
Nitro preset. Hosting infrastructure and backend providers are independent
choices, subject to runtime compatibility. Modex uses Cloudflare only as the
real dogfood target for its existing D1 database and private R2 bucket.

## Scope

- Pin the published console RC; keep the default provider configuration neutral.
- Document Node/container deployment and Nitro presets for other hosts.
- Preserve the packaged UI, including Insights and Distribution detail.
- Supply a separate Workers configuration and runtime-only provider example.
- Use D1 and R2 bindings; provider API credentials and mobile signing private
  keys are not required by the deployed Worker.
- Keep the existing Google/GitHub OAuth adapter and exact, verified-email
  allowlist. Authentication must precede data access and mutation.
- Document cloning, configuration, OAuth callbacks, secrets, building,
  deploying, verification, updating, and rollback.
- Deploy a dedicated Modex console Worker without replacing the OTA Worker or
  creating another copy of its database or bundle storage.
- Record the actual dogfood configuration and results, excluding secrets.

## Exclusions

- Multi-tenant hosting, billing, invitations, and a new identity system.
- Mobile build or OTA deployment pipelines in the hosted console.
- Schema migration or changes to existing releases solely to test hosting.
- Public access to Modex management data.

## Architecture

The standalone Vite host builds `@hot-updater/console` through its exported
plugin. Nitro selects the server and assets output for the deployment host.
Backend plugins connect the existing app resources. In the optional Cloudflare
example, request bindings initialize the worker-compatible D1 and R2 plugins. Better Auth handles OAuth and encrypted cookie sessions; every
protected operation checks the verified-email allowlist.

Local CLI operation and the standalone deployment remain separate entry
points for the same package. Runtime configuration contains only console,
database, storage, and optional signing status. Native build plugins and
private signing keys stay in the mobile repository.

## Acceptance criteria

1. A fresh install uses npm RC packages and no local links or preview tarballs.
2. Auth tests, typechecking, Node/Vercel/Netlify/Worker builds pass; Node and
   Worker runtime smoke checks pass, plus the Worker dry run.
3. The guide's commands produce a deployable artifact using the checked-in
   examples, with generated binding types and ignored local secret files.
4. Modex has a working HTTPS console backed by its existing resources.
5. Anonymous reads, writes, and downloads cannot access management data;
   unapproved identities are denied and approved OAuth login works.
6. The authenticated remote UI shows the same Bundles, Insights, Distribution,
   and events as the local console; bundle download works where data exists.
7. Direct navigation, refresh, mobile layout, and sign-out work remotely.
8. Public documentation and a sanitized Modex runbook identify exact versions,
   deployment commands, the remote URL, verification, and recovery steps.

## Delivery sequence

1. Validate the RC template and close build/runtime gaps.
2. Publish clone-to-deploy instructions and automated regression coverage for
   any discovered behavior defects.
3. Merge the verified template and deployment guide so a clone of the default
   branch includes the RC host and runtime fix.
4. Configure OAuth, bind existing Modex resources, deploy the Worker, and record
   authenticated remote QA. This remains required to complete the project.

## Findings and decisions

- Target RCs at kickoff: console `1.0.0-rc.7`, Cloudflare `1.0.0-rc.5`.
- Existing template authentication requires a complete Google or GitHub OAuth
  pair. Modex's local CLI credentials do not provide those credentials.
- The existing Cloudflare account is accessible through Wrangler. Cloudflare
  Access is not enabled; the template's existing OAuth adapter is the baseline.
- The checked-in README's `authorityId` example is stale for the published RC
  and must be removed rather than copied into the deployed configuration.
- A successful Cloudflare build and dry run left CommonJS React references
  unresolved in the Worker. Bundling React, React DOM, and the external-store
  shim during SSR fixes the first-request 500. The built Worker is now exercised
  in CI with Wrangler's local integration test harness.
- Wrangler loads only listed `secrets.required` keys during local development.
  The selected OAuth provider's pair must be included; GitHub is the default.

## Verification record

- Published RC install and generated binding typecheck: passed.
- Existing authentication tests: 9 passed.
- Node, Vercel, Netlify, and Cloudflare builds: passed; Cloudflare dry run: passed.
- Node and Worker runtime smoke checks: sign-in HTML, anonymous session, protected read,
  protected write, and bundle download denial passed.
- Documentation-site build, dead-link check, repository lint, and 2,680 tests:
  passed before the final operations-record update.
- Modex deployment: prepared; the user has created the GitHub OAuth app.
  Locating its private credential storage and authenticated remote QA are pending.
  No remote success is claimed until authenticated dogfood QA completes.

## Hosting scope clarification

The deployable product is a Nitro console, not a Cloudflare console. The default
config chooses no backend; Cloudflare resources and setup live in an optional
example. The general guide follows Nitro's official deployment catalog. Node
and Worker artifacts receive runtime checks; Vercel and Netlify receive build
checks. Remote dogfood is performed on Modex/Cloudflare only and is not evidence
that all Nitro providers have been deployed.
