"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDark(false);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        setDark(true);
      }
    }
  }, []);

  function toggleTheme() {
    const root = document.documentElement;

    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: "8px 14px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}