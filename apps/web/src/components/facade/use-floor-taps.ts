"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";

import { defaultTapX, FACADE_WIDTH } from "./facade-geometry";

type FloorTapsOptions = {
  active: number | null;
  settled: boolean;
  select: (floor: number) => void;
};

/**
 * Touch and mouse behave differently on the facade: a mouse click opens the floor at once,
 * the first tap only selects the floor and a second tap on the same floor opens it.
 */
export function useFloorTaps({ active, settled, select }: FloorTapsOptions) {
  const pointerType = useRef<string | null>(null);
  const [tapX, setTapX] = useState(defaultTapX);

  const handlePointerDown = (event: PointerEvent<Element>) => {
    pointerType.current = event.pointerType;
  };

  // Focus that comes from a tap must not count as the first tap, or the second tap logic navigates at once.
  const handleFocus = (floor: number) => {
    if (pointerType.current === null) select(floor);
  };

  const handleFloorClick = (floor: number, event: MouseEvent<Element>) => {
    const type = pointerType.current;
    pointerType.current = null;
    const isTap = type === "touch" || type === "pen";
    if (!isTap || (floor === active && settled)) return;
    event.preventDefault();
    const svg = event.currentTarget.closest("svg");
    if (svg) {
      const box = svg.getBoundingClientRect();
      setTapX(((event.clientX - box.left) / box.width) * FACADE_WIDTH);
    }
    select(floor);
  };

  return { tapX, handlePointerDown, handleFocus, handleFloorClick };
}
