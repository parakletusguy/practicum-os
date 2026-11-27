import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  portalAccess: vi.fn(),
  cycle: vi.fn(),
  staff: vi.fn(),
  access: vi.fn(),
  alerts: vi.fn(),
  events: vi.fn(),
  verifiedMinutes: vi.fn(),
}));

vi.mock("@/lib/portal-access", () => ({ requirePortalAccess: mocks.portalAccess }));
vi.mock("@/lib/runtime-mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/db", () => ({
  db: {
    practicumCycle: { findFirst: mocks.cycle },
    orgMembership: { findMany: mocks.staff, findFirst: mocks.access },
    earlyWarningAlert: { findMany: mocks.alerts },
    practiceEvent: { findMany: mocks.events, aggregate: mocks.verifiedMinutes },
  },
}));

import AdminDashboard from "@/app/[tenant]/admin/page";

const render = async () => renderToStaticMarkup(await AdminDashboard({ params: Promise.resolve({ tenant: "rsu" }) }));

describe("institutional dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.portalAccess.mockResolvedValue({ actor: { id: "staff-1" }, tenant: { id: "rsu-id", name: "Rivers State University" } });
    mocks.staff.mockResolvedValue([{ personId: "staff-1" }, { personId: "staff-2" }]);
    mocks.access.mockResolvedValue({ id: "admin-grant" });
  });

  it("shows staff setup and skips activity queries when there is no active cycle", async () => {
    mocks.cycle.mockResolvedValue(null);
    const html = await render();
    expect(html).toContain("Social Work staff pilot");
    expect(html).toContain("2 staff accounts enabled");
    expect(html).toContain('href="/rsu/admin/access"');
    expect(html).toContain("No practicum cycle configured yet.");
    for (const query of [mocks.alerts, mocks.events, mocks.verifiedMinutes]) expect(query).not.toHaveBeenCalled();
  });

  it("shows a planning cycle and gives a coordinator setup links for their role", async () => {
    mocks.cycle.mockResolvedValueOnce(null).mockResolvedValueOnce({ name: "Field Education", status: "PLANNING" });
    mocks.access.mockResolvedValue(null);
    const html = await render();
    expect(html).toContain("Field Education · planning");
    expect(html).toContain('href="/rsu/admin/cycles"');
    expect(html).not.toContain('href="/rsu/admin/access"');
  });

  it("scopes live activity to the active cycle and authenticated institution", async () => {
    mocks.cycle.mockResolvedValue({ id: "active-cycle", name: "Field Education", students: [], placementOffers: [] });
    mocks.alerts.mockResolvedValue([]);
    mocks.events.mockResolvedValue([]);
    mocks.verifiedMinutes.mockResolvedValue({ _sum: { verifiedMinutes: null } });
    const html = await render();
    const allocation = { cycleId: "active-cycle", cycle: { tenantId: "rsu-id" } };
    expect(mocks.alerts).toHaveBeenCalledWith(expect.objectContaining({ where: { allocation, isResolved: false } }));
    for (const query of [mocks.events, mocks.verifiedMinutes]) {
      expect(query).toHaveBeenCalledWith(expect.objectContaining({ where: { allocation, verificationStatus: "VERIFIED" } }));
    }
    expect(html).toContain("No verified activities for this cycle yet.");
    expect(html).not.toContain("52% Completed");
  });
});
