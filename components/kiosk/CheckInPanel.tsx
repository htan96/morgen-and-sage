"use client";

import { useEffect, useState } from "react";

type Person = {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
};

type Kitchen = {
  id: string;
  name: string;
};

export default function CheckInPanel() {
  const [type, setType] = useState<"tenant" | "employee">("tenant");
  const [query, setQuery] = useState("");
  const [scheduled, setScheduled] = useState<Person[]>([]);
  const [others, setOthers] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedKitchen, setSelectedKitchen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load kitchens
  useEffect(() => {
    async function loadKitchens() {
      const res = await fetch("/api/kiosk/kitchen-status");
      const data = await res.json();
      setKitchens(data.kitchens || []);

      if (data.kitchens?.length === 1) {
        setSelectedKitchen(data.kitchens[0].id);
      }
    }
    loadKitchens();
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

  async function handleCheckIn() {
    if (!selectedPerson || !selectedKitchen) return;

    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/kiosk/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        person_id: selectedPerson.id,
        kitchen_space_id: selectedKitchen,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error || "Check-in failed");
      return;
    }

    setMessage("Checked in successfully!");
    setSelectedPerson(null);
    setQuery("");
    setSelectedKitchen(null);

    setTimeout(() => {
      setMessage(null);
    }, 2000);
  }

  return (
    <div style={{ padding: 32 }}>
      <h2 style={{ marginBottom: 20 }}>Check-In Panel</h2>

      {/* Toggle */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {["tenant", "employee"].map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t as any);
              setSelectedPerson(null);
              setQuery("");
            }}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid var(--border)",
              background:
                type === t ? "var(--surface)" : "transparent",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t === "tenant" ? "Tenant" : "Employee"}
          </button>
        ))}
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
            const isSelected = selectedPerson?.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPerson(p)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 10,
                  cursor: "pointer",
                  border: isSelected
                    ? "2px solid var(--text)"
                    : "1px solid var(--border)",
                  background: isSelected
                    ? "var(--hover)"
                    : "var(--surface)",
                  transition: "all 0.2s ease",
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
            const isSelected = selectedPerson?.id === p.id;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPerson(p)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 10,
                  cursor: "pointer",
                  border: isSelected
                    ? "2px solid var(--text)"
                    : "1px solid var(--border)",
                  background: isSelected
                    ? "var(--hover)"
                    : "var(--surface)",
                  transition: "all 0.2s ease",
                }}
              >
                {displayName(p)}
              </div>
            );
          })}
        </>
      )}

      {/* Kitchen Card Selector */}
      {kitchens.length > 0 && (
        <div style={{ marginTop: 30 }}>
          <div style={{ marginBottom: 12, fontWeight: 700 }}>
            Select Kitchen
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {kitchens.map((k) => {
              const isSelected = selectedKitchen === k.id;

              return (
                <div
                  key={k.id}
                  onClick={() => setSelectedKitchen(k.id)}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    cursor: "pointer",
                    border: isSelected
                      ? "2px solid var(--text)"
                      : "1px solid var(--border)",
                    background: isSelected
                      ? "var(--hover)"
                      : "var(--surface)",
                    transition: "all 0.2s ease",
                    fontWeight: 600,
                  }}
                >
                  {k.name}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation */}
      {(selectedPerson || selectedKitchen) && (
        <div
          style={{
            marginTop: 20,
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          {selectedPerson && (
            <div>
              Person: {displayName(selectedPerson)}
            </div>
          )}
          {selectedKitchen && (
            <div>
              Kitchen:{" "}
              {
                kitchens.find(
                  (k) => k.id === selectedKitchen
                )?.name
              }
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        disabled={!selectedPerson || !selectedKitchen || loading}
        onClick={handleCheckIn}
        style={{
          marginTop: 30,
          width: "100%",
          padding: "20px",
          fontSize: 18,
          fontWeight: 800,
          borderRadius: 18,
          border: "1px solid var(--border)",
          background:
            !selectedPerson || !selectedKitchen
              ? "var(--hover)"
              : "var(--text)",
          color:
            !selectedPerson || !selectedKitchen
              ? "var(--text-muted)"
              : "var(--bg)",
          cursor:
            !selectedPerson || !selectedKitchen
              ? "not-allowed"
              : "pointer",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? "Processing..." : "CHECK IN"}
      </button>

      {message && (
        <div style={{ marginTop: 20 }}>{message}</div>
      )}
    </div>
  );
}