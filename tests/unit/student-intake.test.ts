import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { rsuStudentIntakeFormId } from "@/modules/practicum-core/student-intake";

const mocks = vi.hoisted(() => ({ institution: vi.fn(), store: vi.fn() }));
vi.mock("@/lib/runtime-mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/db", () => ({
  db: {
    organisation: { findFirst: mocks.institution },
    studentIntakeResponse: { createMany: mocks.store },
  },
}));

import { POST } from "@/app/api/integrations/rsu-student-intake/route";

const registration = {
  id: "sample-form-response",
  submittedAt: "2026-11-27T15:00:00.000Z",
  firstName: " Sample ",
  lastName: "Student",
  email: " SAMPLE@EXAMPLE.COM ",
  matricNumber: " 001234 ",
  level: "300",
};

function send(body: unknown, key = "test-key") {
  return POST(new Request("https://example.com/api/integrations/rsu-student-intake", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  }));
}

describe("RSU registration intake", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv("RSU_INTAKE_SECRET", "test-key");
    mocks.institution.mockResolvedValue({ id: "rsu-tenant" });
    mocks.store.mockResolvedValue({ count: 1 });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("requires the configured key and exact form before reading or writing records", async () => {
    expect((await send({ formId: rsuStudentIntakeFormId, responses: [registration] }, "wrong")).status).toBe(401);
    expect((await send({ formId: "different-form", responses: [registration] })).status).toBe(400);
    expect(mocks.institution).not.toHaveBeenCalled();
    expect(mocks.store).not.toHaveBeenCalled();
  });

  it("queues normalized student details for RSU and ignores repeated source IDs", async () => {
    const result = await send({ formId: rsuStudentIntakeFormId, responses: [registration] });
    expect(await result.json()).toEqual({ queued: 1 });
    expect(mocks.institution).toHaveBeenCalledWith({
      where: { slug: "rsu", verificationStatus: "VERIFIED" },
      select: { id: true },
    });
    expect(mocks.store).toHaveBeenCalledWith({
      data: [{
        sourceId: registration.id, tenantId: "rsu-tenant", submittedAt: new Date(registration.submittedAt),
        firstName: "Sample", lastName: "Student", email: "sample@example.com", matricNumber: "001234", level: "300L",
      }],
      skipDuplicates: true,
    });
  });

  it("accepts old responses without a level and rejects unsupported levels", async () => {
    expect((await send({ formId: rsuStudentIntakeFormId, responses: [{ ...registration, level: undefined }] })).status).toBe(200);
    expect((await send({ formId: rsuStudentIntakeFormId, responses: [{ ...registration, level: "500" }] })).status).toBe(400);
    expect(mocks.store).toHaveBeenCalledTimes(1);
  });
});
