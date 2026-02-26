"use client";

import { useEffect, useState } from "react";

export default function WeeklyOverview({
  weekStart,
}: {
  weekStart: Date;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/activity/week?start=${weekStart.toISOString()}`
      );
      const data = await res.json();
      setCount(data.sessions?.length || 0);
    }
    load();
  }, [weekStart]);

  return (
    <div
      style={{
        background: "var(--surface)",
        padding: 28,
        borderRadius: 24,
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8 }}>
        Weekly Summary
      </div>
      <div>Total Sessions: {count}</div>
    </div>
  );
}