"use client";

import React from "react";
import { useToast } from "./ToastProvider";
import type { ToastKind } from "./ToastProvider";

const kindStyle: Record<
  ToastKind,
  {
    bg: string;
    border: string;
    color: string;
    ariaRole: "status" | "alert";
    ariaLive: "polite" | "assertive";
    icon: string;
  }
> = {
  ok: {
    bg: "#0ea5e922", // teal-ish with alpha
    border: "#0ea5e9",
    color: "#0f172a",
    ariaRole: "status",
    ariaLive: "polite",
    icon: "✓",
  },
  err: {
    bg: "#ef444422",
    border: "#ef4444",
    color: "#0f172a",
    ariaRole: "alert",
    ariaLive: "assertive",
    icon: "⚠",
  },
  info: {
    bg: "#6366f122",
    border: "#6366f1",
    color: "#0f172a",
    ariaRole: "status",
    ariaLive: "polite",
    icon: "ℹ",
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: "auto 16px 16px auto", // bas droite
        display: "grid",
        gap: 8,
        zIndex: 9999,
        pointerEvents: "none", // clics passent à travers sauf sur les toasts
      }}
    >
      {toasts.map((t) => {
        // garantit une valeur définie même si le type change
        const k = kindStyle[t.kind] ?? kindStyle.info;

        return (
          <div
            key={t.id}
            role={k.ariaRole}
            aria-live={k.ariaLive}
            style={{
              pointerEvents: "auto",
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 8,
              minWidth: 260,
              maxWidth: 420,
              padding: "10px 12px",
              borderRadius: 10,
              background: k.bg,
              border: `1px solid ${k.border}`,
              color: k.color,
              boxShadow:
                "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              backdropFilter: "blur(6px)",
              animation: "toast-in 160ms ease-out",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
              {k.icon}
            </span>
            <div style={{ display: "grid" }}>
              {t.title && (
                <strong style={{ fontSize: 14, lineHeight: 1.2 }}>{t.title}</strong>
              )}
              <span style={{ fontSize: 14 }}>{t.text}</span>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fermer la notification"
              style={{
                border: "none",
                background: "transparent",
                color: "#334155",
                fontSize: 18,
                lineHeight: 1,
                cursor: "pointer",
                padding: 4,
                margin: -4,
              }}
            >
              ×
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </div>
  );
}

export default Toaster;
