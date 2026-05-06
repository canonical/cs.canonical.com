import { type RefObject, useCallback, useLayoutEffect, useState } from "react";

export interface DropdownPosition {
  top: number;
  left: number;
  inputRight: number;
  width: number;
}

export const useDropdownPosition = (inputRef: RefObject<HTMLElement>, enabled: boolean): DropdownPosition | null => {
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  const compute = useCallback(() => {
    const node = inputRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setPosition({
      top: rect.bottom,
      left: rect.left,
      inputRight: window.innerWidth - rect.right,
      width: rect.width,
    });
  }, [inputRef]);

  useLayoutEffect(() => {
    if (!enabled) {
      setPosition(null);
      return;
    }

    compute();

    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(compute);
      compute();
    };

    window.addEventListener("scroll", onChange, true);
    window.addEventListener("resize", onChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onChange, true);
      window.removeEventListener("resize", onChange);
    };
  }, [enabled, compute]);

  return position;
};
