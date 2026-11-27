import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { allocationRecordScope, fieldSupervisorScope, studentPlacementScope } from "@/lib/record-access";

const mocks = vi.hoisted(() => ({
  requireAuthenticatedActor: vi.fn(),
  findEvidence: vi.fn(),
  signEvidence: vi.fn(),
}));

vi.mock("@/lib/authz", () => ({
  AuthenticationError: class AuthenticationError extends Error {},
  requireAuthenticatedActor: mocks.requireAuthenticatedActor,
}));
vi.mock("@/lib/db", () => ({ db: { practiceEvent: { findUnique: mocks.findEvidence } } }));
vi.mock("@/lib/runtime-mode", () => ({
  isDemoMode: () => false,
  getSupabasePublicConfig: () => ({ url: "https://example.test" }),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ storage: { from: () => ({ createSignedUrl: mocks.signEvidence }) } }),
}));

import { GET } from "@/app/api/evidence/[eventId]/route";
import { AuthenticationError } from "@/lib/authz";

const getEvidence = () => GET(new NextRequest("http://localhost/api/evidence/event-1"), {
  params: Promise.resolve({ eventId: "event-1" }),
});

describe("allocation access", () => {
  it("requires both a student's assignment and active student role", () => {
    expect(studentPlacementScope("student-1")).toEqual({
      studentPersonId: "student-1",
      cycle: { tenant: { memberships: { some: { personId: "student-1", status: "ACTIVE", role: "STUDENT" } } } },
    });
  });

  it("requires assigned field supervision in the selected institution and an active role at the institution or host", () => {
    const scope = fieldSupervisorScope("field-1", "school-1");
    expect(scope.fieldSupervisorId).toBe("field-1");
    expect(scope.cycle).toEqual({ tenantId: "school-1" });
    expect(scope.OR).toHaveLength(2);
    expect(scope.OR?.[0]).toMatchObject({ hostOrg: { memberships: { some: { personId: "field-1", status: "ACTIVE" } } } });
    expect(scope.OR?.[1]).toMatchObject({ cycle: { tenant: { memberships: { some: { personId: "field-1", status: "ACTIVE" } } } } });
  });
});

describe("evidence download", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuthenticatedActor.mockResolvedValue({ id: "student-1" });
  });

  it("denies unauthenticated access before looking up the record", async () => {
    mocks.requireAuthenticatedActor.mockRejectedValue(new AuthenticationError());
    expect((await getEvidence()).status).toBe(401);
    expect(mocks.findEvidence).not.toHaveBeenCalled();
  });

  it("combines authorization and record lookup and never signs an inaccessible file", async () => {
    mocks.findEvidence.mockResolvedValue(null);
    expect((await getEvidence()).status).toBe(404);
    expect(mocks.findEvidence).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "event-1", allocation: allocationRecordScope("student-1") },
    }));
    expect(mocks.signEvidence).not.toHaveBeenCalled();
  });

  it("issues a short-lived link only for an authorized file under its allocation", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-storage-key");
    try {
      mocks.findEvidence.mockResolvedValue({ allocationId: "allocation-1", evidenceUrl: "allocation-1/note.pdf" });
      mocks.signEvidence.mockResolvedValue({ data: { signedUrl: "https://example.test/private-note" } });
      const response = await getEvidence();
      expect(mocks.signEvidence).toHaveBeenCalledWith("allocation-1/note.pdf", 60, { download: true });
      expect(response.status).toBe(307);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
