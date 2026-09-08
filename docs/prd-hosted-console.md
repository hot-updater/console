# Hosted Console: RC template and Modex deployment

Status: implementation in progress

## Problem

`hot-updater console` serves the management UI from a developer's computer.
Teams need a persistent HTTPS console that remains available when that computer
is offline. The standalone repository currently pins a temporary preview build,
and its Cloudflare instructions have not been validated against a real app.

## Outcome

A developer can clone `hot-updater/console`, configure their existing Hot Updater
backend and OAuth access, and deploy the same console to Cloudflare Workers.
Modex will use this path against its existing D1 database and private R2 bucket.

## Scope

- Pin the published console RC and Cloudflare provider RC in the template.
- Preserve the packaged UI, including Insights and Distribution detail.
- Supply a working Workers configuration and runtime-only provider example.
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
plugin. Nitro's Cloudflare preset emits the Worker and static assets. The
request's Cloudflare bindings initialize the worker-compatible D1 and R2
plugins. Better Auth handles OAuth and encrypted cookie sessions; every
protected operation checks the verified-email allowlist.

Local CLI operation and the standalone deployment remain separate entry
points for the same package. Runtime configuration contains only console,
database, storage, and optional signing status. Native build plugins and
private signing keys stay in the mobile repository.

## Acceptance criteria

1. A fresh install uses npm RC packages and no local links or preview tarballs.
2. Auth tests, typechecking, Node build, Worker build, and Wrangler dry run pass.
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
3. Configure OAuth, bind existing Modex resources, and deploy the Worker.
4. Run remote QA and record evidence before merging the repository changes.

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
- Node and Cloudflare builds: passed; Cloudflare dry run: passed.
- Worker runtime smoke check: sign-in HTML, anonymous session, protected read,
  protected write, and bundle download denial passed.
- Documentation-site build, dead-link check, repository lint, and 2,680 tests:
  passed before the final operations-record update.
- Modex deployment: prepared; OAuth app registration confirmation is pending.
  No remote success is claimed until authenticated dogfood QA completes.
