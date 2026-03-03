"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function EmailIntegrationCard({ profile }: any) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isConnected = !!profile?.google_refresh_token;
  const automationEnabled = !!profile?.google_automation_enabled;

  const connect = () => {
    window.location.href = "/api/google/connect";
  };

  const disconnect = async () => {
    setLoading(true);
    await fetch("/api/google/disconnect", { method: "POST" });
    setLoading(false);
    router.refresh();
  };

  const testSend = async () => {
    setLoading(true);
    await fetch("/api/google/test-send");
    setLoading(false);
  };

  const toggleAutomation = async () => {
    setLoading(true);
    await fetch("/api/google/automation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !automationEnabled }),
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="ui-card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Email Sending Account</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Connect a Google account to send invoices and automated emails.
        </p>
      </div>

      {isConnected ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Connected as
              </p>
              <p className="font-medium">{profile.google_email}</p>
            </div>

            <span
              className="px-3 py-1 text-xs rounded-full"
              style={{
                background: "var(--hover)",
                color: automationEnabled ? "var(--btn-save)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {automationEnabled ? "Automation Active" : "Automation Off"}
            </span>
          </div>

          {/* Automation Toggle */}
          <div
            className="p-4 rounded-xl"
            style={{ background: "var(--hover)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Activate automation</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Enables scheduled invoice emails and automatic notifications using this Google account.
                </p>
              </div>

              <button
                onClick={toggleAutomation}
                disabled={loading}
                className={automationEnabled ? "ui-btn ui-btn-cancel" : "ui-btn-filled-save"}
              >
                {automationEnabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={testSend} disabled={loading} className="ui-btn-filled-save">
              Send Test Email
            </button>

            <button onClick={disconnect} disabled={loading} className="ui-btn ui-btn-delete">
              Disconnect
            </button>
          </div>
        </>
      ) : (
        <button onClick={connect} className="ui-btn-filled-save">
          Connect Google
        </button>
      )}
    </div>
  );
}