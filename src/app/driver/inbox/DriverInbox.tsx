"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { listPendingRequestsAction } from "@/server/actions/listPendingRequests";
import { rejectBookingAction } from "@/server/actions/rejectBooking";
import { acceptBookingAction } from "@/server/actions/acceptBooking";
import { useToast } from "@/components/toast/ToastProvider";

type Row = {
  booking_id: string;
  created_at: string;
  seats: number;
  passenger_id: string;
  trip_id: string;
  trip_starts_at: string | null;
};

// Format FR sans lib externe
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
  const [linePending, setLinePending] = useState<Set<string>>(new Set());
  const { success: toastOk, error: toastErr } = useToast();

  async function refresh() {
    const res = await listPendingRequestsAction();
    if (!res.ok) {
      toastErr(res.error ?? "Erreur de chargement");
    } else {
      setRows(res.data);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const isLinePending = useMemo(
    () => (id: string) => linePending.has(id),
    [linePending]
  );

  function handle(action: "accept" | "reject", bookingId: string) {
    const snapshot = rows;
    const target = rows.find((r) => r.booking_id === bookingId);
    if (!target) return;

    // Optimiste: retirer la ligne
    setRows((prev) => prev.filter((r) => r.booking_id !== bookingId));
    setLinePending((s) => new Set(s).add(bookingId));

    startTransition(async () => {
      try {
        const res =
          action === "accept"
            ? await acceptBookingAction(bookingId)
            : await rejectBookingAction(bookingId);

        if (!res.ok) {
          // rollback
          setRows(snapshot);
          toastErr(res.error ?? "Une erreur est survenue");
          return;
        }

        toastOk(action === "accept" ? "Réservation acceptée" : "Réservation refusée");
      } catch (e) {
        setRows(snapshot);
        toastErr("Erreur réseau. Réessaie.");
      } finally {
        setLinePending((s) => {
          const n = new Set(s);
          n.delete(bookingId);
          return n;
        });
        // Option: re-sync pour refléter des changements backend
        // await refresh();
      }
    });
  }

  return (
    <div>
      <h2>Demandes en attente</h2>

      {rows.length === 0 && !pending && <p>Aucune demande en attente.</p>}

      <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
        {rows.map((r) => {
          const disabled = isLinePending(r.booking_id);
          return (
            <li
              key={r.booking_id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 12,
                opacity: disabled ? 0.6 : 1,
              }}
              aria-busy={disabled}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
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
    </div>
  );
}
