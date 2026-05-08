import { describe, expect, it } from "vitest";

import { canActOnPage } from "./permissions";

import type { IPage } from "@/services/api/types/pages";
import type { IUser } from "@/services/api/types/users";

const makeUser = (overrides: Partial<IUser> = {}): IUser => ({
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  jobTitle: "",
  department: "",
  team: "",
  role: "",
  ...overrides,
});

const makePage = (overrides: Partial<IPage> = {}): IPage => ({
  id: 10,
  name: "/page",
  copy_doc_link: "",
  owner: makeUser({ email: "owner@example.com", name: "Owner" }),
  reviewers: [],
  status: "AVAILABLE",
  jira_tasks: [],
  children: [],
  products: [],
  ...overrides,
});

describe("canActOnPage", () => {
  it("returns false when user is null", () => {
    expect(canActOnPage(null, makePage())).toBe(false);
  });

  it("returns false when user has no email", () => {
    expect(canActOnPage(makeUser({ email: "" }), makePage())).toBe(false);
  });

  it("returns true for an admin even if they are unrelated to the page", () => {
    const admin = makeUser({ email: "admin@example.com", role: "admin" });
    expect(canActOnPage(admin, makePage())).toBe(true);
  });

  it("returns true when the user is the page owner", () => {
    const owner = makeUser({ email: "owner@example.com" });
    expect(canActOnPage(owner, makePage())).toBe(true);
  });

  it("returns true when the user is in the reviewers array", () => {
    const reviewer = makeUser({ email: "reviewer@example.com" });
    const page = makePage({
      reviewers: [makeUser({ email: "reviewer@example.com", name: "Reviewer" })],
    });
    expect(canActOnPage(reviewer, page)).toBe(true);
  });

  it("returns false for an unrelated user", () => {
    const stranger = makeUser({ email: "stranger@example.com" });
    expect(canActOnPage(stranger, makePage())).toBe(false);
  });

  it("returns false when reviewers is undefined and user is unrelated", () => {
    const stranger = makeUser({ email: "stranger@example.com" });
    const page = makePage({ reviewers: undefined as unknown as IPage["reviewers"] });
    expect(canActOnPage(stranger, page)).toBe(false);
  });

  it("returns false when page.owner is missing and user is unrelated", () => {
    const stranger = makeUser({ email: "stranger@example.com" });
    const page = makePage({ owner: null as unknown as IPage["owner"] });
    expect(canActOnPage(stranger, page)).toBe(false);
  });
});
