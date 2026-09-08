# Hosted Console: Nitro deployment and Modex dogfood

Status: implementation and Modex dogfood QA complete; follow-up documentation PRs remain open for review.

## Problem

`hot-updater console` serves the management UI from a developer's computer.
Teams need a persistent HTTPS console that remains available when that computer
is offline. At kickoff, the standalone repository pinned a temporary preview build
and lacked a reproducible path from clone to a hosted app.

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
3. Merge the verified RC host and runtime fixes. Keep the follow-up documentation
   PRs open for review, with Basics, Cloudflare, Vercel, and Netlify child guides.
4. Configure OAuth, bind existing Modex resources, deploy the Worker, and record
   authenticated remote QA.

## Findings and decisions

- Target RCs at kickoff: console `1.0.0-rc.7`, Cloudflare `1.0.0-rc.5`.
- Final dogfood versions: console `1.0.0-rc.9`, local CLI `1.0.0-rc.11`,
  Cloudflare `1.0.0-rc.5`; template main commit `27d54b7`.
- Existing template authentication requires a complete Google or GitHub OAuth
  pair. Modex's local CLI credentials do not provide those credentials.
- The existing Cloudflare account is accessible through Wrangler. Cloudflare
  Access is not enabled; the template's existing OAuth adapter is the baseline.
- Removed the README's stale `authorityId` example from the published RC
  configuration.
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
- The final sign-out fix also passes all 167 console tests, console typecheck,
  and the repository's full integration CI.
- Modex deployment uses the merged template, published console RC, existing
  D1/R2 resources, and GitHub OAuth with privately stored credentials.
- Approved GitHub login, matching Bundles/Insights/Distribution data, events
  pagination (20 then 2 records), cursor reload, and authenticated artifact
  download passed on the actual HTTPS origin. The artifact's 39 ZIP entries
  passed CRC validation.
- App usage and Distribution are both 430px high on the hosted desktop dashboard.
  The hosted sign-in layout fits 390px; dashboard layouts with real and dense
  data were checked locally at 320px and 390px without horizontal overflow.
- Actual authenticated QA found that sign-out needs a JSON content type.
  The follow-up console fix covers both sidebar and access-denied sign-out;
  its focused regression tests fail before the fix and pass after it.
  On the final RC, sign-out returns to the login page, clears the browser
  session, and makes protected downloads return HTTP 401. Reload preserves
  the signed-out state.
- Dogfood URL: [Modex console](https://modex-hot-updater-console.gron1gh1.workers.dev).
  Verified on 2026-09-08, Worker version `cc4dfd5a-e0b7-4a80-bd4f-d61dd8ee365b`.

## Hosting scope clarification

The deployable product is a Nitro console, not a Cloudflare console. The default
config chooses no backend; Cloudflare resources and setup live in an optional
example. The general guide follows Nitro's official deployment catalog. Node
and Worker artifacts receive runtime checks; Vercel and Netlify receive build
checks. Remote dogfood is performed on Modex/Cloudflare only and is not evidence
that all Nitro providers have been deployed.
