"use client";

type Props = {
  now: Date;
};

export default function LiveFeed({ now }: Props) {
  return (
    <div
      style={{
        flex: 1.2,
        padding: 24,
      }}
    >
      <h2 style={{ marginBottom: 20 }}>Live Activity Feed</h2>

      <div
        style={{
          padding: 20,
          borderRadius: 16,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        No active sessions.
      </div>
    </div>
  );
}