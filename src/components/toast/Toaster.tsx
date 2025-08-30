"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useToast } from "./ToastProvider";

const kindStyle: Record<string, { bg: string; border: string; color: string; icon: string; ariaRole: "status" | "alert"; ariaLive: "polite" | "assertive" }> = {
  ok:   { bg: "rgba(46, 204, 113, 0.1)", border: "#2ecc71", color: "#1e824c", icon: "✓", ariaRole: "status", ariaLive: "polite" },
  err:  { bg: "rgba(231, 76, 60, 0.1)",  border: "#e74c3c", color: "#a82315", icon: "⚠", ariaRole: "alert",  ariaLive: "assertive" },
  info: { bg: "rgba(52, 152, 219, 0.1)", border: "#3498db", color: "#1b6fa9", icon: "ℹ", ariaRole: "status", ariaLive: "polite" },
};

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      style={{
        position: "fixed",
        inset: "auto 16px 16px auto",
        display: "grid",
        gap: 8,
        zIndex: 1000,
        maxWidth: 360,
      }}
    >
      {toasts.map((t) => {
        const k = kindStyle[t.kind];
        return (
          <div
            key={t.id}
            role={k.ariaRole}
            aria-live={k.ariaLive}
            style={{
              display: "grid",
              gridTemplateColumns: "24px 1fr auto",
              alignItems: "start",
              gap: 8,
              background: k.bg,
              border: `1px solid ${k.border}`,
              color: k.color,
              padding: "10px 12px",
              borderRadius: 8,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              backdropFilter: "saturate(140%) blur(2px)",
            }}
          >
            <div aria-hidden="true" style={{ fontWeight: 700, lineHeight: "20px" }}>{k.icon}</div>
            <div>
              {t.title && <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.title}</div>}
              <div>{t.text}</div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Fermer la notification"
              style={{
                appearance: "none",
                border: "none",
                background: "transparent",
                color: k.color,
                cursor: "pointer",
                fontSize: 16,
                lineHeight: "16px",
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
