import { describe, expect, it } from "vitest";
import { createPostingLetterPdf } from "../../src/lib/email/posting-letter-pdf";

describe("posting letter PDF", () => {
  it("generates a non-empty PDF attachment from approved placement data", async () => {
    const pdf = await createPostingLetterPdf({
      institutionName: "Example University",
      departmentName: "Department of Social Work",
      programmeName: "BSc Social Work",
      reference: "EXU/SWK/2026/PL-101",
      issueDate: new Date("2026-10-16T00:00:00.000Z"),
      hostOrganisation: { name: "Example Welfare Agency", address: "1 Example Road", city: "Lagos", country: "Nigeria" },
      student: { name: "Amina Bello", matricNumber: "SWK/2026/001" },
      cycle: {
        academicYear: "2026/2027",
        requiredHours: 400,
        startDate: new Date("2026-10-20T00:00:00.000Z"),
        endDate: new Date("2027-02-20T00:00:00.000Z"),
      },
      fieldSupervisorName: "Tunde Adeyemi",
      academicSupervisorName: "Dr Ada Okafor",
    });

    expect(pdf.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1_000);
  });
});
