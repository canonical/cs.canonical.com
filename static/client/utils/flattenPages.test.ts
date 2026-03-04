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
  it("includes the root page in results", () => {
    const root = makePage({ id: 1, name: "/", children: [] });
    const result = flattenPages(root);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("/");
  });

  it("includes root and flattens a single level of children", () => {
    const root = makePage({
      id: 1,
      name: "/",
      children: [makePage({ name: "/about", title: "About" }), makePage({ name: "/contact", title: "Contact" })],
    });
    const result = flattenPages(root);
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.name)).toEqual(["/", "/about", "/contact"]);
  });

  it("flattens nested children recursively", () => {
    const root = makePage({
      id: 1,
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
    expect(result).toHaveLength(3);
    expect(result.map((p) => p.name)).toEqual(["/", "/products", "/products/cloud"]);
  });

  it("excludes pages with TO_DELETE status", () => {
    const root = makePage({
      id: 1,
      name: "/",
      children: [makePage({ name: "/keep", status: "AVAILABLE" }), makePage({ name: "/remove", status: "TO_DELETE" })],
    });
    const result = flattenPages(root);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["/", "/keep"]);
  });

  it("excludes root when it has TO_DELETE status", () => {
    const root = makePage({
      id: 1,
      name: "/",
      status: "TO_DELETE",
      children: [makePage({ name: "/child", status: "AVAILABLE" })],
    });
    const result = flattenPages(root);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("/child");
  });

  it("excludes the current page by ID when excludeId is provided", () => {
    const root = makePage({
      id: 1,
      name: "/",
      children: [makePage({ id: 10, name: "/self" }), makePage({ id: 20, name: "/other" })],
    });
    const result = flattenPages(root, 10);
    expect(result).toHaveLength(2);
    expect(result.map((p) => p.name)).toEqual(["/", "/other"]);
  });

  it("excludes root when its id matches excludeId", () => {
    const root = makePage({
      id: 5,
      name: "/",
      children: [makePage({ id: 10, name: "/child" })],
    });
    const result = flattenPages(root, 5);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("/child");
  });
});
