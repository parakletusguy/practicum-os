import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn(), findMembership: vi.fn(), getClaims: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { person: mocks, orgMembership: { findFirst: mocks.findMembership } } }));
vi.mock("@/lib/runtime-mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: () => ({ auth: { getClaims: mocks.getClaims } }),
}));

import { AuthorizationError, linkVerifiedActor, requirePlatformAdmin } from "@/lib/authz";

const person = { id: "person", email: "staff@example.com", firstName: "Pilot", lastName: "Staff", isActive: true };

describe("verified identity linking", () => {
  beforeEach(() => vi.resetAllMocks());

  it("accepts a matching identity that another request linked first", async () => {
    mocks.findUnique.mockResolvedValue({ ...person, authUserId: "identity" });
    await expect(linkVerifiedActor("identity", person.email)).resolves.toMatchObject({ id: "person" });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("returns the correct identity after a concurrent link update", async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...person, authUserId: null })
      .mockResolvedValueOnce({ ...person, authUserId: "identity" });
    mocks.updateMany.mockResolvedValue({ count: 0 });
    await expect(linkVerifiedActor("identity", person.email)).resolves.toMatchObject({ id: "person" });
  });

  it("rejects an attempt to bind a person already linked to a different identity", async () => {
    mocks.findUnique.mockResolvedValue({ ...person, authUserId: "different-identity" });
    await expect(linkVerifiedActor("identity", person.email)).rejects.toThrow("different identity");
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});

describe("platform administrator access", () => {
  it("requires a verified active actor with an active platform role", async () => {
    vi.resetAllMocks();
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "identity" } } });
    mocks.findUnique.mockResolvedValue({ ...person, authUserId: "identity" });
    mocks.findMembership.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "platform-role" });
    await expect(requirePlatformAdmin()).rejects.toThrow(AuthorizationError);
    expect(mocks.findMembership).toHaveBeenCalledWith({
      where: { personId: person.id, role: "PLATFORM_SUPERADMIN", status: "ACTIVE" },
      select: { id: true },
    });
    await expect(requirePlatformAdmin()).resolves.toMatchObject({ id: person.id });
  });
});
