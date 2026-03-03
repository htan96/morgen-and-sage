"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EmailIntegrationCard({ profile }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isConnected = !!profile?.google_refresh_token;

  const connect = () => {
    window.location.href = "/api/google/connect";
  };

  const disconnect = async () => {
    setLoading(true);
    await fetch("/api/google/disconnect", { method: "POST" });
    router.refresh();
  };

  const testSend = async () => {
    setLoading(true);
    await fetch("/api/google/test-send");
    setLoading(false);
  };

  return (
    <div className="ui-card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          Email Sending Account
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This Google account is used to send invoices and automated emails.
        </p>
      </div>

      {isConnected ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Connected as
              </p>
              <p className="font-medium">
                {profile.google_email}
              </p>
            </div>

            <span
              className="px-3 py-1 text-xs rounded-full"
              style={{
                background: "var(--hover)",
                color: "var(--btn-save)",
                border: "1px solid var(--border)",
              }}
            >
              Active
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={testSend}
              disabled={loading}
              className="ui-btn-filled-save"
            >
              Send Test Email
            </button>

            <button
              onClick={disconnect}
              disabled={loading}
              className="ui-btn ui-btn-delete"
            >
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={connect}
          className="ui-btn-filled-save"
        >
          Connect Google
        </button>
      )}
    </div>
  );
}