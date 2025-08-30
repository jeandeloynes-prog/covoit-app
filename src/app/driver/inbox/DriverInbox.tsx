"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { listPendingRequestsAction } from "@/server/actions/listPendingRequests";
import { rejectBookingAction } from "@/server/actions/rejectBooking";
import { acceptBookingAction } from "@/server/actions/acceptBooking";

type Row = {
  booking_id: string;
  created_at: string;
  seats: number;
  passenger_id: string;
  trip_id: string;
  trip_starts_at: string | null;
};

// Format date/heure en français, sans dépendance
const fmt = (d: string | Date | null) =>
  d
    ? new Date(d).toLocaleString("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

// Optionnel: "il y a X …"
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
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function refresh() {
    const res = await listPendingRequestsAction();
    if (!res.ok) {
      setMessage({ type: "err", text: res.error ?? "Erreur de chargement" });
    } else {
      setMessage(null);
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
    // Optimistic: retirer la ligne immédiatement, mais garder un snapshot pour rollback
    const snapshot = rows;
    const target = rows.find((r) => r.booking_id === bookingId);
    if (!target) return;

    setRows((prev) => prev.filter((r) => r.booking_id !== bookingId));
    setLinePending((prev) => new Set(prev).add(bookingId));

    startTransition(async () => {
      const res =
        action === "accept"
          ? await acceptBookingAction({ bookingId })
          : await rejectBookingAction({ bookingId });

      // Libère le statut pending de la ligne
      setLinePending((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });

      if (!res.ok) {
        // Rollback
        setRows(snapshot);
        setMessage({ type: "err", text: res.error ?? "Action échouée" });
      } else {
        setMessage({
          type: "ok",
          text: action === "accept" ? "Demande acceptée" : "Demande refusée",
        });
        // Optionnel: resync pour refléter d’éventuels changements côté serveur
        // Evite de flasher si pas nécessaire; décommente si tu veux un vrai resync:
        // await refresh();
      }

      // Efface le message après 3s
      setTimeout(() => setMessage(null), 3000);
    });
  }

  return (
    <div>
      <h2>Demandes en attente</h2>

      {message && (
        <p
          role="status"
          aria-live="polite"
          style={{
            color: message.type === "ok" ? "seagreen" : "crimson",
            marginTop: 4,
          }}
        >
          {message.text}
        </p>
      )}

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
