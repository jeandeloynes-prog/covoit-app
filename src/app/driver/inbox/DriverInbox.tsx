"use client";

import { useEffect, useState, useTransition } from "react";
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
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await listPendingRequestsAction();
    if (!res.ok) setError(res.error ?? "Erreur");
    else {
      setError(null);
      setRows(res.data);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  function handle(action: "accept" | "reject", bookingId: string) {
    startTransition(async () => {
      const res =
        action === "accept"
          ? await acceptBookingAction({ bookingId })
          : await rejectBookingAction({ bookingId });

      if (!res.ok) {
        setError(res.error ?? "Erreur");
      } else {
        setError(null);
        await refresh();
      }
    });
  }

  return (
    <div>
      <h2>Demandes en attente</h2>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {rows.length === 0 && <p>Aucune demande en attente.</p>}
      <ul style={{ display: "grid", gap: 12, padding: 0, listStyle: "none" }}>
        {rows.map((r) => (
          <li
            key={r.booking_id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div>
                  Trajet: {r.trip_id} — {fmt(r.trip_starts_at)}
                </div>
                <div>Passager: {r.passenger_id}</div>
                <div>Places demandées: {r.seats}</div>
                <div>
                  Créée: {fmt(r.created_at)} <span style={{ color: "#666" }}>({since(r.created_at)})</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  disabled={pending}
                  onClick={() => handle("accept", r.booking_id)}
                >
                  {pending ? "..." : "Accepter"}
                </button>
                <button
                  disabled={pending}
                  onClick={() => handle("reject", r.booking_id)}
                >
                  {pending ? "..." : "Refuser"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
