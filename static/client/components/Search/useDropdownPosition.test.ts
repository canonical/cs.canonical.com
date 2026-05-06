import { useRef } from "react";

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useDropdownPosition } from "./useDropdownPosition";

const buildInput = (rect: Partial<DOMRect>) => {
  const el = document.createElement("input");
  el.getBoundingClientRect = vi.fn(() => ({
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  })) as unknown as () => DOMRect;
  document.body.appendChild(el);
  return el;
};

describe("useDropdownPosition", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1000 });
  });
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  const setup = (input: HTMLInputElement, enabled: boolean) =>
    renderHook(() => {
      const ref = useRef<HTMLInputElement>(input);
      return useDropdownPosition(ref, enabled);
    });

  it("returns null when disabled", () => {
    const input = buildInput({ left: 10, right: 110, bottom: 30, width: 100 });
    const { result } = setup(input, false);
    expect(result.current).toBeNull();
  });

  it("computes position from the input rect when enabled", () => {
    const input = buildInput({ left: 10, right: 110, bottom: 30, width: 100 });
    const { result } = setup(input, true);
    expect(result.current).toEqual({ top: 30, left: 10, inputRight: 890, width: 100 });
  });

  it("recomputes on window scroll", () => {
    const input = buildInput({ left: 10, right: 110, bottom: 30, width: 100 });
    const { result } = setup(input, true);

    vi.mocked(input.getBoundingClientRect).mockReturnValue({
      bottom: 60,
      left: 20,
      right: 200,
      width: 180,
      top: 40,
      height: 20,
      x: 20,
      y: 40,
      toJSON: () => ({}),
    } as DOMRect);

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toEqual({ top: 60, left: 20, inputRight: 800, width: 180 });
  });

  it("recomputes on window resize", () => {
    const input = buildInput({ left: 10, right: 110, bottom: 30, width: 100 });
    const { result } = setup(input, true);

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    vi.mocked(input.getBoundingClientRect).mockReturnValue({
      bottom: 30,
      left: 10,
      right: 110,
      width: 100,
      top: 10,
      height: 20,
      x: 10,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);

    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current?.inputRight).toBe(390);
  });

  it("ignores scroll events when disabled", () => {
    const input = buildInput({ left: 10, right: 110, bottom: 30, width: 100 });
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => {
        const ref = useRef<HTMLInputElement>(input);
        return useDropdownPosition(ref, enabled);
      },
      { initialProps: { enabled: true } },
    );

    rerender({ enabled: false });
    vi.mocked(input.getBoundingClientRect).mockReturnValue({
      bottom: 999,
      left: 999,
      right: 999,
      width: 999,
      top: 999,
      height: 0,
      x: 999,
      y: 999,
      toJSON: () => ({}),
    } as DOMRect);

    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(result.current).toBeNull();
  });
});
