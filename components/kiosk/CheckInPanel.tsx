"use client";

import { useEffect, useState } from "react";

type Person = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
};

type Session = {
  entity_type: string;
  entity_id: string;
};

export default function CheckInPanel() {
  const [type, setType] = useState<"tenant" | "employee">("tenant");
  const [query, setQuery] = useState("");
  const [scheduled, setScheduled] = useState<Person[]>([]);
  const [others, setOthers] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  // Load active sessions
  async function loadActiveSessions() {
    const res = await fetch("/api/kiosk/active-sessions");
    const data = await res.json();
    setActiveSessions(data || []);
  }

  useEffect(() => {
    loadActiveSessions();
  }, []);

  // Lookup people
  useEffect(() => {
    async function lookup() {
      const res = await fetch(
        `/api/kiosk/lookup?type=${type}&q=${query}`
      );
      const data = await res.json();
      setScheduled(data.scheduled || []);
      setOthers(data.others || []);
    }
    lookup();
  }, [query, type]);

  function displayName(p: Person) {
    if (type === "tenant") return p.name;
    return `${p.first_name} ${p.last_name}`;
  }

  // When selecting a person
  function handleSelect(p: Person) {
    setSelectedPerson(p);

    const active = activeSessions.some(
      (s: any) =>
        s.entity_type === type &&
        s.entity_id === p.id
    );

    setIsActive(active);
  }

  async function handleAction() {
    if (!selectedPerson) return;

    setLoading(true);
    setMessage(null);

    const endpoint = isActive
      ? "/api/kiosk/check-out"
      : "/api/kiosk/check-in";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        person_id: selectedPerson.id,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Action failed");
      return;
    }

    setMessage(
      isActive
        ? "Checked out successfully!"
        : "Checked in successfully!"
    );

    // Refresh active sessions
    await loadActiveSessions();

    // Reset panel
    setSelectedPerson(null);
    setQuery("");
    setIsActive(false);

    setTimeout(() => {
      setMessage(null);
    }, 2000);
  }

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 20 }}>Check-In Panel</h2>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["tenant", "employee"].map((t) => {
          const selected = type === t;

          return (
            <button
              key={t}
              onClick={() => {
                setType(t as any);
                setSelectedPerson(null);
                setQuery("");
                setIsActive(false);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "1px solid var(--border)",
                background: selected
                  ? "var(--surface)"
                  : "transparent",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {t === "tenant" ? "Tenant" : "Employee"}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name..."
        style={{
          width: "100%",
          padding: 14,
          fontSize: 16,
          borderRadius: 12,
          border: "1px solid var(--border)",
          marginBottom: 20,
          background: "var(--surface)",
          color: "var(--text)",
        }}
      />

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <>
          <div style={{ marginBottom: 10, fontWeight: 700 }}>
            Scheduled Now
          </div>
          {scheduled.map((p) => {
            const selected = selectedPerson?.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 10,
                  cursor: "pointer",
                  border: selected
                    ? "2px solid var(--text)"
                    : "1px solid var(--border)",
                  background: selected
                    ? "var(--hover)"
                    : "var(--surface)",
                }}
              >
                {displayName(p)}
              </div>
            );
          })}
        </>
      )}

      {/* Others */}
      {others.length > 0 && (
        <>
          <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 700 }}>
            All
          </div>
          {others.map((p) => {
            const selected = selectedPerson?.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 10,
                  cursor: "pointer",
                  border: selected
                    ? "2px solid var(--text)"
                    : "1px solid var(--border)",
                  background: selected
                    ? "var(--hover)"
                    : "var(--surface)",
                }}
              >
                {displayName(p)}
              </div>
            );
          })}
        </>
      )}

      {/* Submit Button */}
      <button
        disabled={!selectedPerson || loading}
        onClick={handleAction}
        style={{
          marginTop: 30,
          width: "100%",
          padding: "20px",
          fontSize: 18,
          fontWeight: 800,
          borderRadius: 18,
          border: "1px solid var(--border)",
          background: !selectedPerson
            ? "var(--hover)"
            : "var(--text)",
          color: !selectedPerson
            ? "var(--text-muted)"
            : "var(--bg)",
          cursor: !selectedPerson
            ? "not-allowed"
            : "pointer",
        }}
      >
        {loading
          ? "Processing..."
          : isActive
          ? "CHECK OUT"
          : "CHECK IN"}
      </button>

      {message && (
        <div style={{ marginTop: 20 }}>
          {message}
        </div>
      )}
    </div>
  );
}