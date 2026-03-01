"use client";

import { ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSubmit?: () => void;
  submitLabel?: string;
};

export default function SlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  submitLabel = "Save",
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">

      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Right Panel */}
      <div className="absolute right-0 top-0 h-full w-[480px] bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="px-6 py-6 border-b border-[var(--border)]">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text)]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--surface)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg)] transition"
          >
            Cancel
          </button>

          {onSubmit && (
            <button
              onClick={onSubmit}
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition"
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}