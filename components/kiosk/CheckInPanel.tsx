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

    setTimeout(() => {
      setMessage(null);
    }, 2000);
  }

  return (
    <div style={{ flex: 1, padding: 32 }}>
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
        }}
      />

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <>
          <div style={{ marginBottom: 10, fontWeight: 700 }}>
            Scheduled Now
          </div>
          {scheduled.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPerson(p)}
              style={{
                padding: 14,
                borderRadius: 12,
                marginBottom: 8,
                cursor: "pointer",
                background:
                  selectedPerson?.id === p.id
                    ? "var(--surface)"
                    : "transparent",
                border: "1px solid var(--border)",
              }}
            >
              {displayName(p)}
            </div>
          ))}
        </>
      )}

      {/* Others */}
      {others.length > 0 && (
        <>
          <div style={{ marginTop: 20, marginBottom: 10, fontWeight: 700 }}>
            All
          </div>
          {others.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPerson(p)}
              style={{
                padding: 14,
                borderRadius: 12,
                marginBottom: 8,
                cursor: "pointer",
                background:
                  selectedPerson?.id === p.id
                    ? "var(--surface)"
                    : "transparent",
                border: "1px solid var(--border)",
              }}
            >
              {displayName(p)}
            </div>
          ))}
        </>
      )}

      {/* Kitchen Select */}
      {kitchens.length > 1 && (
            <select
      value={selectedKitchen || ""}
      onChange={(e) => setSelectedKitchen(e.target.value)}
      className="w-full mt-5"
    >
          <option value="">Select Kitchen</option>
          {kitchens.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      )}

      {/* Submit */}
      <button
  disabled={!selectedPerson || !selectedKitchen || loading}
  onClick={handleCheckIn}
  style={{
    marginTop: 30,
    width: "100%",
    padding: "18px 20px",
    fontSize: 17,
    fontWeight: 800,
    letterSpacing: 0.5,
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
        <div style={{ marginTop: 20 }}>
          {message}
        </div>
      )}
    </div>
  );
}