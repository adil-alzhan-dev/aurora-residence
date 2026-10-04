"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import { prefersReducedMotion } from "@/lib/motion";

const STEP_MS = 60;
const VISIBLE_SHARE = 0.4;

/**
 * Demo from Motion notes: on first view the highlight sweeps up from floor 1 to the target floor,
 * then the tooltip appears. Any hover, tap or focus stops it; with reduced motion it never runs.
 */
export function useFloorDemo(stageRef: RefObject<HTMLElement | null>, target: number) {
  const [active, setActive] = useState<number | null>(target);
  const [settled, setSettled] = useState(true);
  const stopDemo = useRef<() => void>(() => {});

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion()) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      setActive(null);
      setSettled(false);
    });
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        let floor = 1;
        setActive(floor);
        timer = window.setInterval(() => {
          floor += 1;
          setActive(floor);
          if (floor >= target) {
            window.clearInterval(timer);
            setSettled(true);
          }
        }, STEP_MS);
      },
      { threshold: VISIBLE_SHARE },
    );
    observer.observe(stage);
    const stop = () => {
      observer.disconnect();
      window.clearInterval(timer);
      cancelAnimationFrame(frame);
    };
    stopDemo.current = stop;
    return stop;
  }, [stageRef, target]);

  const select = useCallback((floor: number) => {
    stopDemo.current();
    setActive(floor);
    setSettled(true);
  }, []);

  return { active, settled, select };
}
