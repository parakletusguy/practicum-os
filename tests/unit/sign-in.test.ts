import { describe, expect, it } from "vitest";
import { isCommunitySignUp, isRsuEmail, signInDestination, signInErrorMessage } from "../../src/lib/sign-in";

describe("institutional sign-in", () => {
  it("returns users to their chosen internal workspace and preserves local filters", () => {
    expect(signInDestination("/rsu/admin/cohort?cycleId=123")).toBe("/rsu/admin/cohort?cycleId=123");
    expect(signInDestination(null)).toBe("/auth/workspaces");
    expect(signInDestination("/auth/login")).toBe("/auth/workspaces");
  });

  it("rejects absolute and cross-origin redirects", () => {
    expect(signInDestination("https://outside.example/rsu/admin")).toBe("/auth/workspaces");
    expect(signInDestination("//outside.example/rsu/admin")).toBe("/auth/workspaces");
    expect(signInDestination("/\\outside.example/rsu/admin")).toBe("/auth/workspaces");
  });

  it("recognises exact RSU domains and retains the community registration flow", () => {
    expect(isRsuEmail("Applicant@UST.EDU.NG")).toBe(true);
    expect(isRsuEmail("applicant@rsu.edu.ng")).toBe(true);
    expect(isRsuEmail("applicant@rsu.edu.ng.outside.example")).toBe(false);
    expect(isRsuEmail("applicant@gmail.com")).toBe(false);
    expect(isCommunitySignUp("/gateways/help?from=nav")).toBe(true);
    expect(isCommunitySignUp("/rsu/student")).toBe(false);
    expect(signInErrorMessage("authentication")).toContain("could not be completed");
  });
});
