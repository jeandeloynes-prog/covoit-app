"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type ToastKind = "ok" | "err" | "info";

export type Toast = {
  id: string;
  kind: ToastKind;
  title?: string;
  text: string;
  // en ms
  duration?: number;
};

type Ctx = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  // helpers
  success: (text: string, opts?: Omit<Toast, "id" | "text" | "kind">) => string;
  error: (text: string, opts?: Omit<Toast, "id" | "text" | "kind">) => string;
  info: (text: string, opts?: Omit<Toast, "id" | "text" | "kind">) => string;
};

const ToastContext = createContext<Ctx | null>(null);

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tid = timeoutsRef.current[id];
    if (tid) {
      window.clearTimeout(tid);
      delete timeoutsRef.current[id];
    }
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = uid();
      const duration = t.duration ?? (t.kind === "err" ? 5000 : 3000);
      setToasts((prev) => [...prev, { ...t, id, duration }]);

      // auto-dismiss
      if (typeof window !== "undefined" && duration > 0) {
        const tid = window.setTimeout(() => dismiss(id), duration);
        timeoutsRef.current[id] = tid;
      }
      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (text: string, opts?: Omit<Toast, "id" | "text" | "kind">) =>
      push({ kind: "ok", text, ...opts }),
    [push]
  );
  const error = useCallback(
    (text: string, opts?: Omit<Toast, "id" | "text" | "kind">) =>
      push({ kind: "err", text, ...opts }),
    [push]
  );
  const info = useCallback(
    (text: string, opts?: Omit<Toast, "id" | "text" | "kind">) =>
      push({ kind: "info", text, ...opts }),
    [push]
  );

  const value = useMemo<Ctx>(() => ({ toasts, push, dismiss, success, error, info }), [toasts, push, dismiss, success, error, info]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast doit être utilisé dans <ToastProvider>.");
  }
  return ctx;
}
