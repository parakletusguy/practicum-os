# Product-claim and delivery guardrails

This project does not currently include a generative-AI feature. “Hallucination” guardrails therefore mean preventing unsupported product claims and unverified implementation status from reaching users or release notes.

## Rules

1. A user-facing capability claim must link to an implemented code path and an automated check before it is described as available.
2. Demo, preview, prototype, and production behavior must be visibly distinguished. Demo roles must never be described as authentication.
3. Never claim an action is automated, secure, private, compliant, immutable, or delivered unless the complete production behavior and its verification exist.
4. Authentication, authorization, tenant scoping, storage access, and state transitions are release blockers. The UI must not imply otherwise.
5. Each phase closes only after its exit checks pass in a separate test environment. A build alone does not prove a workflow is complete.
6. Failed or unavailable integrations must report their actual state; do not substitute simulated success.

## Evidence required for release claims

| Claim type | Minimum evidence |
| --- | --- |
| User access | Authenticated browser test plus role/tenant authorization test |
| Data isolation | Cross-tenant denial test |
| File privacy | Unauthenticated download denial test and signed-link expiry test |
| Automated alert | Scheduled-job execution record plus notification delivery record |
| Workflow completion | End-to-end browser test that uses the same server actions as the UI |

## Portal access browser check

Run `node scripts/verify_portal_access.mjs` against a local or staging instance with demo mode disabled. Set `PRACTICUM_BROWSER_BASE_URL`. The runner uses Playwright, either installed locally or supplied as a module URL through `PRACTICUM_PLAYWRIGHT_MODULE`. Set `PRACTICUM_BROWSER_CHANNEL=chrome` to use an installed Chrome.

For authenticated checks, set `PRACTICUM_BROWSER_FIXTURES` to a local JSON file with two test tenant slugs in `tenant` and `otherTenant`, plus a `sessions` object with `student`, `field`, and `faculty` Playwright storage-state paths. Use synthetic records and provide these fixture keys:

- `studentLogbookMarker`, `otherStudentLogbookMarker`, `fieldAssignedMarker`, `fieldUnassignedMarker`, `facultyAssignedMarker`, and `facultyUnassignedMarker` as text unique to each fixture.
- `unassignedTraineeId`, `ownEventId`, `sameTenantOtherEventId`, and `otherTenantEventId` as synthetic record IDs. The three events should each have private evidence.

Keep the storage states outside version control since they contain test session credentials. Prepare the second tenant so it has records but grants no membership to the test actors in `sessions`.

## Offline logbook browser check

Run `node scripts/verify_offline_logbook.mjs` with the same base URL, browser channel, and Playwright module settings. The smoke test uses synthetic data in a fresh browser profile. It closes and reopens the logbook while disconnected, checks passphrase protection and encrypted draft persistence, and checks that the authenticated logbook page is absent from the cache. Reconnect and submit through the student portal in staging to verify authenticated synchronization.

## Release checklist

- [ ] Claims reviewed against implementation and tests
- [ ] Demo labels reviewed on public pages
- [ ] Production secrets are configured outside the repository
- [ ] Migration and rollback steps are rehearsed against a non-production database
- [ ] Known limitations are documented in the release notes
