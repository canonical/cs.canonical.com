import { describe, expect, it } from "vitest";

import { flattenPages } from "./flattenPages";

import type { IPage } from "@/services/api/types/pages";

const makePage = (overrides: Partial<IPage>): IPage => ({
  name: "/default",
  title: "Default",
  copy_doc_link: "",
  owner: { id: 1, name: "user", email: "", jobTitle: "", department: "", team: "", role: "" },
  reviewers: [],
  status: "AVAILABLE",
  jira_tasks: [],
  children: [],
  products: [],
  ...overrides,
});

describe("flattenPages", () => {
  it("returns an empty array for a page with no children", () => {
    const root = makePage({ name: "/", children: [] });
    expect(flattenPages(root)).toEqual([]);
  });

  it("flattens a single level of children", () => {
    const root = makePage({
      name: "/",
      children: [makePage({ name: "/about", title: "About" }), makePage({ name: "/contact", title: "Contact" })],
    });
    const result = flattenPages(root);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("/about");
    expect(result[1].name).toBe("/contact");
  });

  it("flattens nested children recursively", () => {
    const root = makePage({
      name: "/",
      children: [
        makePage({
          name: "/products",
          title: "Products",
          children: [makePage({ name: "/products/cloud", title: "Cloud" })],
        }),
      ],
    });
    const result = flattenPages(root);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["/products", "/products/cloud"]);
  });

  it("excludes pages with TO_DELETE status", () => {
    const root = makePage({
      name: "/",
      children: [makePage({ name: "/keep", status: "AVAILABLE" }), makePage({ name: "/remove", status: "TO_DELETE" })],
    });
    const result = flattenPages(root);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("/keep");
  });

  it("excludes the current page by ID when excludeId is provided", () => {
    const root = makePage({
      name: "/",
      children: [makePage({ id: 10, name: "/self" }), makePage({ id: 20, name: "/other" })],
    });
    const result = flattenPages(root, 10);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("/other");
  });
});
