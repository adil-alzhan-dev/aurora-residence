import { useState, useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  window.addEventListener("load", onChange);
  return () => window.removeEventListener("load", onChange);
};

const isLoaded = () => document.readyState === "complete";

const onServer = () => false;

/**
 * Whether a crossfade layer (the other time of day) should be in the page. A hidden layer waits
 * for the page to finish loading, so it never takes bandwidth from the first screen; a layer
 * that has been shown once stays, so a switch before the load still fades out smoothly.
 */
export function useDeferredLayer(visible: boolean) {
  const loaded = useSyncExternalStore(subscribe, isLoaded, onServer);
  const [shown, setShown] = useState(visible);
  if (visible && !shown) setShown(true);
  return shown || loaded;
}
