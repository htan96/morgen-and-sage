"use client";

import { useEffect, useState } from "react";

type Entity = {
  id: string;
  name: string;
};

type Kitchen = {
  id: string;
  name: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  session: any;
};

export default function SessionModal({
  open,
  onClose,
  session,
}: Props) {
  const [entityType, setEntityType] =
    useState<"tenant" | "employee">("tenant");

  const [entities, setEntities] =
    useState<Entity[]>([]);
  const [kitchens, setKitchens] =
    useState<Kitchen[]>([]);

  const [selectedEntity, setSelectedEntity] =
    useState("");
  const [selectedKitchen, setSelectedKitchen] =
    useState("");

  const [checkIn, setCheckIn] =
    useState("");
  const [checkOut, setCheckOut] =
    useState("");

  useEffect(() => {
    async function loadKitchens() {
      const res = await fetch(
        "/api/kiosk/kitchen-status"
      );
      const data = await res.json();
      setKitchens(data.kitchens || []);
    }
    loadKitchens();
  }, []);

  useEffect(() => {
    async function loadEntities() {
      const res = await fetch(
        `/api/kiosk/lookup?type=${entityType}&q=`
      );
      const data = await res.json();

      const combined = [
        ...(data.scheduled || []),
        ...(data.others || []),
      ];

      setEntities(combined);
    }

    if (!session) {
      loadEntities();
    }
  }, [entityType, session]);

  useEffect(() => {
    if (session) {
      setCheckIn(
        new Date(session.check_in_time)
          .toISOString()
          .slice(0, 16)
      );
      setCheckOut(
        session.check_out_time
          ? new Date(session.check_out_time)
              .toISOString()
              .slice(0, 16)
          : ""
      );
    } else {
      setCheckIn("");
      setCheckOut("");
      setSelectedEntity("");
      setSelectedKitchen("");
    }
  }, [session]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 40,
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 480,
          height: "100vh",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          padding: 36,
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              marginBottom: 6,
            }}
          >
            {session
              ? "Edit Session"
              : "Add Session"}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            Manual operational time entry
          </div>
        </div>

        {/* Form */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {!session && (
            <>
              <Field label="Type">
                <select
                  value={entityType}
                  onChange={(e) =>
                    setEntityType(
                      e.target.value as any
                    )
                  }
                >
                  <option value="tenant">
                    Tenant
                  </option>
                  <option value="employee">
                    Employee
                  </option>
                </select>
              </Field>

              <Field
                label={
                  entityType === "tenant"
                    ? "Tenant"
                    : "Employee"
                }
              >
                <select
                  value={selectedEntity}
                  onChange={(e) =>
                    setSelectedEntity(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select...
                  </option>
                  {entities.map((e) => (
                    <option
                      key={e.id}
                      value={e.id}
                    >
                      {e.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kitchen">
                <select
                  value={selectedKitchen}
                  onChange={(e) =>
                    setSelectedKitchen(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select...
                  </option>
                  {kitchens.map((k) => (
                    <option
                      key={k.id}
                      value={k.id}
                    >
                      {k.name}
                    </option>
                  ))}
                </select>
              </Field>
            </>
          )}

          <div
            style={{
              borderTop:
                "1px solid var(--border)",
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            <Field label="Check In">
              <input
                type="datetime-local"
                value={checkIn}
                onChange={(e) =>
                  setCheckIn(
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Check Out">
              <input
                type="datetime-local"
                value={checkOut}
                onChange={(e) =>
                  setCheckOut(
                    e.target.value
                  )
                }
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: 24,
            borderTop:
              "1px solid var(--border)",
            display: "flex",
            gap: 12,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 14,
              border:
                "1px solid var(--border)",
              background: "transparent",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>

          <button
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 14,
              border: "none",
              background:
                "var(--text)",
              color: "var(--bg)",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <label
        style={{
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        {label}
      </label>

      <div
        style={{
          border:
            "1px solid var(--border)",
          borderRadius: 12,
          padding: 10,
          background: "var(--bg)",
        }}
      >
        {children}
      </div>
    </div>
  );
}