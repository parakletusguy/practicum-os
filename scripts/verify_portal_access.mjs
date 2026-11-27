import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const baseURL = process.env.PRACTICUM_BROWSER_BASE_URL;
if (!baseURL) throw new Error("Set PRACTICUM_BROWSER_BASE_URL to a local or staging instance running with demo mode disabled.");
const { chromium } = await import(process.env.PRACTICUM_PLAYWRIGHT_MODULE || "playwright");
const fixturesPath = process.env.PRACTICUM_BROWSER_FIXTURES;
const fixtures = fixturesPath ? JSON.parse(await readFile(fixturesPath, "utf8")) : null;
const tenant = fixtures?.tenant || "unilag";
const browser = await chromium.launch({ channel: process.env.PRACTICUM_BROWSER_CHANNEL || "chromium" });

try {
  const visitor = await browser.newContext({ baseURL });
  const visitorPage = await visitor.newPage();
  for (const path of [`/${tenant}/student/logbook`, `/${tenant}/field/evaluations`,
    `/${tenant}/faculty/evaluations`, `/${tenant}/admin/access`, "/gateways/provider/referrals"]) {
    await visitorPage.goto(path);
    assert.equal(new URL(visitorPage.url()).pathname, "/auth/login", path + " allowed anonymous access");
  }
  assert.equal((await visitor.request.get("/api/evidence/anonymous-probe", { maxRedirects: 0 })).status(), 401);
  await visitor.close();
  console.log("Anonymous portal and evidence checks passed.");

  if (!fixtures) {
    console.log("Authenticated checks require a staging fixture file with role-specific storage states.");
  } else {
    const checks = [
      ["student", `/${tenant}/student/logbook`, [fixtures.studentLogbookMarker], [fixtures.otherStudentLogbookMarker]],
      ["field", `/${tenant}/field/evaluations`, [fixtures.fieldAssignedMarker], [fixtures.fieldUnassignedMarker]],
      ["faculty", `/${tenant}/faculty/evaluations`, [fixtures.facultyAssignedMarker], [fixtures.facultyUnassignedMarker]],
    ];
    for (const [role, target, visible, hidden] of checks) {
      const context = await browser.newContext({ baseURL, storageState: fixtures.sessions[role] });
      try {
        const page = await context.newPage();
        await page.goto(target);
        assert.equal(new URL(page.url()).pathname, target);
        const html = await page.content();
        for (const marker of visible) assert.ok(marker && html.includes(marker), `${role}: assigned record missing`);
        for (const marker of hidden) assert.ok(marker && !html.includes(marker), `${role}: unassigned record is present`);
        await page.goto(target.replace(`/${tenant}/`, `/${fixtures.otherTenant}/`));
        assert.equal(new URL(page.url()).pathname, "/auth/login");
        if (role === "field") {
          const result = await page.goto(`/${tenant}/field/trainees/${fixtures.unassignedTraineeId}`);
          assert.equal(result?.status(), 404);
        }
        if (role === "student") {
          for (const id of [fixtures.sameTenantOtherEventId, fixtures.otherTenantEventId]) {
            assert.ok(id, "An inaccessible evidence event fixture is required");
            assert.equal((await context.request.get(`/api/evidence/${id}`, { maxRedirects: 0 })).status(), 404);
          }
          const ownEvidence = await context.request.get(`/api/evidence/${fixtures.ownEventId}`, { maxRedirects: 0 });
          assert.equal(ownEvidence.status(), 307);
          assert.match(ownEvidence.headers()["cache-control"] || "", /no-store/);
        }
      } finally {
        await context.close();
      }
    }
    console.log("Authenticated student, supervisor, tenant, and evidence checks passed.");
  }
} finally {
  await browser.close();
}
