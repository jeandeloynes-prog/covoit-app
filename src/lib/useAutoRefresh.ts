"use client";

import { useEffect, useRef } from "react";

type Fn = () => Promise<void> | void;

export function useAutoRefresh(run: Fn, opts?: { intervalMs?: number }) {
  const interval = opts?.intervalMs ?? 25_000;
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let stopped = false;

    const clearTimer = () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const schedule = (ms: number) => {
      clearTimer();
      timerRef.current = window.setTimeout(tick, ms);
    };

    const tick = async () => {
      if (stopped || document.hidden) {
        // quand on repasse visible, on relancera
        return;
      }
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      try {
        await run();
      } finally {
        // petit jitter pour éviter l’alignement des clients
        const jitter = 2_000 * Math.random();
        schedule(interval + jitter);
      }
    };

    const onVisibility = () => {
      if (!document.hidden) {
        // focus: relance immédiate
        void run().finally(() => schedule(interval));
      } else {
        // pause
        clearTimer();
        abortRef.current?.abort();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    // premier passage
    void run().finally(() => schedule(interval));

    return () => {
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      clearTimer();
      abortRef.current?.abort();
    };
  }, [run, interval]);
}
