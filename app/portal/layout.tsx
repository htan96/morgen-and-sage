import Sidebar from "@/components/Sidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className="flex-1 p-10"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        {children}
      </main>
    </div>
  );
}