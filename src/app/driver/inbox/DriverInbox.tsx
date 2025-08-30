"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { listPendingRequestsAction } from "@/server/actions/listPendingRequests";
import { rejectBookingAction } from "@/server/actions/rejectBooking";
import { acceptBookingAction } from "@/server/actions/acceptBooking";
import { useToast } from "@/components/toast/ToastProvider";
import { useAutoRefresh } from "@/lib/useAutoRefresh";

type Row = {
  booking_id: string;
  created_at: string;
  seats: number;
  passenger_id: string;
  trip_id: string;
  trip_starts_at: string | null;
};

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error?: string; code?: string };

const fmt = (d: string | Date | null) =>
  d
    ? new Date(d).toLocaleString("fr-BE", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

const since = (d: string | Date) => {
  const diff = Date.now() - new Date(d).getTime();
  const sec = Math.max(0, Math.round(diff / 1000));
  if (sec < 60) return `il y a ${sec}s`;
  const min = Math.round(sec / 60);
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.round(h / 24);
  return `il y a ${j} j`;
};

export function DriverInbox() {
  const [rows, setRows] = useState<Row[]>([]);
  const [pending, startTransition] = useTransition();

  // Contexte toast (API flexible)
  const toastCtx = useToast() as any;

  // notify mémoïsé pour éviter les warnings react-hooks/exhaustive-deps
  const notify = useMemo(
    () => ({
      success: (p: { title?: string; text: string }) =>
        toastCtx?.toast?.success?.(p) ??
        toastCtx?.success?.(p) ??
        toastCtx?.push?.({ kind: "ok", ...p }),
      error: (p: { title?: string; text: string }) =>
        toastCtx?.toast?.error?.(p) ??
        toastCtx?.error?.(p) ??
        toastCtx?.push?.({ kind: "err", ...p }),
      info: (p: { title?: string; text: string }) =>
        toastCtx?.toast?.info?.(p) ??
        toastCtx?.info?.(p) ??
        toastCtx?.push?.({ kind: "info", ...p }),
    }),
    [toastCtx]
  );

  const refresh = useCallback(async () => {
    const res = (await listPendingRequestsAction()) as ActionResult<Row[]>;
    if (res.ok) {
      setRows(res.data);
    } else {
      notify.error({
        title: "Échec de l’actualisation",
        text: res.error ?? "Impossible de charger les demandes en attente.",
      });
    }
  }, [notify]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Auto-refresh toutes les 25 s, pause si onglet en arrière‑plan
  useAutoRefresh(refresh, { intervalMs: 25_000 });

  const handle = useCallback(
    async (action: "accept" | "reject", bookingId: string) => {
      // Optimistic UI
      const prev = rows;
      const next = prev.filter((r) => r.booking_id !== bookingId);
      setRows(next);

      const res =
      action === "accept"
    ? await acceptBookingAction({ booking_id: bookingId })
    : await rejectBookingAction({ booking_id: bookingId });


      if (!res.ok) {
        // rollback
        setRows(prev);

        switch (res.code) {
          case "NOT_OWNER":
            notify.error({
              title: "Action refusée",
              text: "Vous n’êtes pas le conducteur de ce trajet.",
            });
            break;
          case "BOOKING_NOT_FOUND":
            notify.info({
              title: "Réservation introuvable",
              text: "Elle a peut‑être déjà été traitée.",
            });
            break;
          case "BOOKING_NOT_PENDING":
          case "ALREADY_ACCEPTED":
          case "ALREADY_REJECTED":
            notify.info({
              title: "Déjà traité",
              text: "Cette demande n’est plus en attente.",
            });
            break;
          case "TRIP_FULL":
            notify.error({
              title: "Trajet complet",
              text: "Plus de places disponibles sur ce trajet.",
            });
            break;
          default:
            notify.error({
              title: "Erreur",
              text: res.error ?? "Une erreur est survenue.",
            });
        }
        return;
      }

      // Succès
      if (action === "accept") {
        notify.success({ title: "Acceptée", text: "La réservation est validée." });
      } else {
        notify.info({ title: "Refusée", text: "La réservation a été refusée." });
      }

      // Re-synchronise la liste
      startTransition(() => {
        void refresh();
      });
    },
    [rows, notify, refresh]
  );

  const disabled = pending;

  const content = useMemo(() => {
    if (rows.length === 0) {
      return (
        <div style={{ color: "#64748b" }}>
          Aucune demande en attente pour le moment.
        </div>
      );
    }
    return (
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rows.map((r) => {
          return (
            <li key={r.booking_id} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: 12,
                  background: "#fff",
                }}
              >
                <div>
                  <div>
                    Trajet: {r.trip_id} — {fmt(r.trip_starts_at)}
                  </div>
                  <div>Passager: {r.passenger_id}</div>
                  <div>Places demandées: {r.seats}</div>
                  <div>
                    Créée: {fmt(r.created_at)}{" "}
                    <span style={{ color: "#666" }}>({since(r.created_at)})</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    disabled={disabled}
                    onClick={() => handle("accept", r.booking_id)}
                  >
                    {disabled ? "..." : "Accepter"}
                  </button>
                  <button
                    disabled={disabled}
                    onClick={() => handle("reject", r.booking_id)}
                  >
                    {disabled ? "..." : "Refuser"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }, [rows, disabled, handle]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Demandes en attente</h2>
        <button onClick={() => refresh()} disabled={pending}>
          {pending ? "Actualisation..." : "Rafraîchir"}
        </button>
      </div>
      {content}
    </div>
  );
}

export default DriverInbox;
