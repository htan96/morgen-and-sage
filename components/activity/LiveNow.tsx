"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  entity_type: string;
  check_in_time: string;
};

function durationSince(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function LiveNow() {
  const [sessions, setSessions] = useState<Session[]>([]);

  async function load() {
    const res = await fetch("/api/activity/live");
    const data = await res.json();
    setSessions(data.sessions || []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: "var(--surface)", padding: 20, borderRadius: 16 }}>
      <div style={{ fontWeight: 800, marginBottom: 10 }}>Live Now</div>

      {sessions.length === 0 ? (
        <div>No active sessions.</div>
      ) : (
        sessions.map((s) => (
          <div key={s.id} style={{ marginBottom: 8 }}>
            {s.entity_type.toUpperCase()} — {durationSince(s.check_in_time)}
          </div>
        ))
      )}
    </div>
  );
}