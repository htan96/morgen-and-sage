"use client";

import { useEffect, useState } from "react";

type Kitchen = {
  id: string;
  name: string;
};

type Session = {
  id: string;
  kitchen_space_id: string;
  check_in_time: string;
  tenant?: { id: string; name: string } | null;
  employee?: { id: string; first_name: string; last_name: string } | null;
};

function durationSince(iso: string) {
  const diff = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  );

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function KitchenCards() {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/kiosk/kitchen-status");
      const data = await res.json();

      setKitchens(data.kitchens || []);
      setSessions(data.sessions || []);
    }

    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!kitchens.length) {
    return (
      <div style={{ padding: 40 }}>
        No kitchens found.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 20,
        padding: "24px 40px",
      }}
    >
      {kitchens.map((k) => {
        const activeSession = sessions.find(
          (s) => s.kitchen_space_id === k.id
        );

        const isAvailable = !activeSession;

        let occupantName = "";

        if (activeSession) {
          if (activeSession.tenant) {
            occupantName = activeSession.tenant.name;
          } else if (activeSession.employee) {
            occupantName =
              `${activeSession.employee.first_name} ${activeSession.employee.last_name}`;
          }
        }

        return (
          <div
            key={k.id}
            style={{
              padding: 22,
              borderRadius: 20,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ fontWeight: 800 }}>
                {k.name}
              </div>

              <div
                style={{
                  marginLeft: "auto",
                  padding: "6px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  background: isAvailable
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(239,68,68,0.15)",
                  color: isAvailable
                    ? "rgb(16,185,129)"
                    : "rgb(239,68,68)",
                }}
              >
                {isAvailable ? "Available" : "Occupied"}
              </div>
            </div>

            {isAvailable ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                Ready for next check-in
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontWeight: 700 }}>
                  {occupantName}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Live: {durationSince(activeSession!.check_in_time)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}