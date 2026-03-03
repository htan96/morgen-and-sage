"use client";

import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SettingsLayout({
  title,
  description,
  children,
}: Props) {
  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>

        {description && (
          <p
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}