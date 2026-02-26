type TabType = "all" | "review" | "analytics" | "reports";

type Props = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

export default function DocumentsTabs({
  activeTab,
  setActiveTab,
}: Props) {
  const tabs = [
    { key: "all", label: "All Documents" },
    { key: "review", label: "Review" },
    { key: "analytics", label: "Analytics" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="mt-4 md:mt-8">
      
      {/* MOBILE — Floating Tabs */}
      <div className="flex gap-6 overflow-x-auto md:hidden pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className="relative text-sm font-medium whitespace-nowrap transition"
              style={{
                color: isActive
                  ? "var(--text)"
                  : "var(--text-muted)",
              }}
            >
              {tab.label}

              {/* Active underline */}
              {isActive && (
                <div
                  className="absolute left-0 right-0 -bottom-2 h-[2px]"
                  style={{
                    background: "var(--text)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* DESKTOP — Segmented Container */}
      <div
        className="hidden md:flex gap-2 p-2 rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition"
              style={{
                background: isActive ? "var(--bg)" : "transparent",
                border: isActive
                  ? "1px solid var(--border)"
                  : "1px solid transparent",
                color: "var(--text)",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}