"use client";

import { useMemo, useState } from "react";
import LiveNow from "./LiveNow";
import WeeklyOverview from "./WeeklyOverview";
import SessionHistory from "./SessionHistory";
import SessionModal from "./SessionModal";

function startOfWeekSaturday(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 1) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export default function ActivityShell() {
  const [weekStart, setWeekStart] = useState(
    startOfWeekSaturday(new Date())
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<any>(null);

  const weekEnd = useMemo(
    () => addDays(weekStart, 6),
    [weekStart]
  );

  function fmt(d: Date) {
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <>
      <div
        style={{
          padding: 40,
          minHeight: "100vh",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
              }}
            >
              Activity Overview
            </div>
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
              }}
            >
              Operational time tracking & audit
            </div>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--surface)",
                padding: "10px 16px",
                borderRadius: 999,
                border: "1px solid var(--border)",
              }}
            >
              <button
                onClick={() =>
                  setWeekStart(
                    addDays(weekStart, -7)
                  )
                }
              >
                ‹
              </button>
              <div style={{ fontWeight: 700 }}>
                {fmt(weekStart)} —{" "}
                {fmt(weekEnd)}
              </div>
              <button
                onClick={() =>
                  setWeekStart(
                    addDays(weekStart, 7)
                  )
                }
              >
                ›
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedSession(null);
                setDrawerOpen(true);
              }}
              style={{
                padding: "12px 20px",
                borderRadius: 16,
                border:
                  "1px solid var(--border)",
                background:
                  "var(--surface)",
                color: "var(--text)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Add Session
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 28 }}>
          <LiveNow />
          <WeeklyOverview
            weekStart={weekStart}
          />
          <SessionHistory
            weekStart={weekStart}
            onEdit={(session) => {
              setSelectedSession(session);
              setDrawerOpen(true);
            }}
          />
        </div>
      </div>

      <SessionModal
        open={drawerOpen}
        session={selectedSession}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSession(null);
        }}
      />
    </>
  );
}