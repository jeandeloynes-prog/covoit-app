"use client";

import { useTransition, useState } from "react";
import { requestBookingAction } from "@/server/actions/requestBooking";

export function RequestBookingForm({ tripId }: { tripId: string }) {
  const [seats, setSeats] = useState(1);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const res = await requestBookingAction({ tripId, seats });
          if (!res.ok) setMsg(res.error ?? "Erreur");
          else setMsg("Demande envoyée");
        });
      }}
    >
      <label>Places</label>
      <input
        type="number"
        min={1}
        max={10}
        value={seats}
        onChange={(e) => setSeats(Number(e.target.value))}
      />
      <button disabled={pending} type="submit">
        {pending ? "Envoi..." : "Demander"}
      </button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
