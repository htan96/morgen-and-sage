"use client";

import Image from "next/image";
import ThemeToggle from "../ThemeToggle";

type Props = {
  now: Date;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatClock(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${pad(m)}:${pad(s)} ${ampm}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function TopBar({ now }: Props) {
  return (
    <div
      style={{
        padding: "24px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      {/* LEFT: Logo + Date */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Light Mode → Dark Logo */}
          <Image
            src="/logos/morgens-kitchen-dark.svg"
            alt="Morgan’s Kitchen"
            width={180}
            height={40}
            className="logo-light"
            priority
          />

          {/* Dark Mode → Light Logo */}
          <Image
            src="/logos/morgens-kitchen-light.svg"
            alt="Morgan’s Kitchen"
            width={180}
            height={40}
            className="logo-dark"
            priority
          />
        </div>

        <div
          style={{
            marginTop: 6,
            fontSize: 14,
            color: "var(--text-muted)",
          }}
        >
          {formatDate(now)}
        </div>
      </div>

      {/* RIGHT: Toggle + Clock */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ThemeToggle />

        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "var(--text)",
          }}
        >
          {formatClock(now)}
        </div>
      </div>
    </div>
  );
}