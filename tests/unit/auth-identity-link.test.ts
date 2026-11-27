import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), updateMany: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: { person: mocks } }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: vi.fn() }));

import { linkVerifiedActor } from "@/lib/authz";

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
