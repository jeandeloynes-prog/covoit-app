"use client";

import { useEffect, useState, useTransition } from "react";
import { listPendingRequestsAction } from "@/server/actions/listPendingRequests";
import { rejectBookingAction } from "@/server/actions/rejectBooking";
import { acceptBookingAction } from "@/server/actions/acceptBooking"; // déjà fourni
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Row = {
  booking_id: string;
  created_at: string;
  seats: number;
  passenger_id: string;
  trip_id: string;
  trip_starts_at: string | null;
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div>
                  Trajet: {r.trip_id}{" "}
                  {r.trip_starts_at &&
                    `— ${format(new Date(r.trip_starts_at), "Pp", { locale: fr })}`}
                </div>
                <div>Passager: {r.passenger_id}</div>
                <div>Places demandées: {r.seats}</div>
                <div>Créée: {format(new Date(r.created_at), "Pp", { locale: fr })}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  disabled={pending}
                  onClick={() => handle("accept", r.booking_id)}
                >
                  Accepter
                </button>
                <button
                  disabled={pending}
                  onClick={() => handle("reject", r.booking_id)}
                >
                  Refuser
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
