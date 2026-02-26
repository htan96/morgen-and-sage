"use client";

import { useEffect, useMemo, useState } from "react";

type Session = {
  id: string;
  entity_type: "tenant" | "employee";
  entity_name: string;
  check_in_time: string;
  check_out_time: string | null;
};

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function duration(a: string, b: string | null) {
  const end = b ? new Date(b).getTime() : Date.now();
  const start = new Date(a).getTime();
  const mins = Math.floor((end - start) / 60000);
  return (mins / 60).toFixed(2);
}

export default function SessionHistory({
  weekStart,
  onEdit,
}: {
  weekStart: Date;
  onEdit: (session: any) => void;
}) {
  const [sessions, setSessions] = useState<
    Session[]
  >([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `/api/activity/week?start=${weekStart.toISOString()}`
      );
      const data = await res.json();
      setSessions(data.sessions || []);
    }
    load();
  }, [weekStart]);

  const grouped = useMemo(() => {
    const map: Record<
      string,
      Session[]
    > = {};
    sessions.forEach((s) => {
      const key = new Date(
        s.check_in_time
      ).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  const sortedDates = Object.keys(
    grouped
  ).sort(
    (a, b) =>
      new Date(a).getTime() -
      new Date(b).getTime()
  );

  return (
    <div
      style={{
        background: "var(--surface)",
        padding: 32,
        borderRadius: 28,
        border:
          "1px solid var(--border)",
      }}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 900,
          marginBottom: 24,
        }}
      >
        Session History
      </div>

      {sortedDates.length === 0 && (
        <div
          style={{
            color: "var(--text-muted)",
          }}
        >
          No sessions this week.
        </div>
      )}

      {sortedDates.map((date) => {
        const sessionsForDate =
          grouped[date];

        return (
          <div
            key={date}
            style={{ marginBottom: 32 }}
          >
            <div
              style={{
                fontWeight: 800,
                marginBottom: 16,
              }}
            >
              {formatDate(
                new Date(date)
              )}
            </div>

            {sessionsForDate.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  padding:
                    "12px 16px",
                  borderRadius: 14,
                  background:
                    "var(--bg)",
                  marginBottom: 10,
                }}
              >
                <div>
                  {s.entity_name} —{" "}
                  {new Date(
                    s.check_in_time
                  ).toLocaleTimeString()}
                </div>

                <button
                  onClick={() =>
                    onEdit(s)
                  }
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}