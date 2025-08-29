// src/app/rides/page.tsx
import { listPublicRides } from "@/server/rpc/list_public_rides";

export default async function RidesPage() {
  const rides = await listPublicRides({ limit: 20 });
  return (
    <main style={{ padding: 24 }}>
      <h1>Trajets disponibles</h1>
      <ul style={{ display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
        {rides.map((r: any) => (
          <li
            key={r.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <div style={{ fontWeight: 600 }}>
              {r.origin_label} → {r.destination_label}
            </div>
            <div>
              Départ: {new Date(r.departure_time).toLocaleString()}
            </div>
            <div>Places dispo: {r.seats_available}</div>
            <div>Prix: {(r.price_cents / 100).toFixed(2)} €</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
