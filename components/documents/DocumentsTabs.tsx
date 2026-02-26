type TabType = "all" | "review" | "analytics" | "reports";

type Props = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
};

export default function DocumentsTabs({
  activeTab,
  setActiveTab,
}: Props) {
  const tabBase =
    "px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer";

  const getTabStyle = (tab: TabType) => {
    const isActive = activeTab === tab;

    return {
      background: isActive ? "var(--bg)" : "transparent",
      border: isActive
        ? "1px solid var(--border)"
        : "1px solid transparent",
      color: "var(--text)",
    };
  };

  return (
    <div
      className="flex gap-2 p-2 rounded-xl mt-8"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className={tabBase}
        style={getTabStyle("all")}
        onClick={() => setActiveTab("all")}
      >
        All Documents
      </div>

      <div
        className={tabBase}
        style={getTabStyle("review")}
        onClick={() => setActiveTab("review")}
      >
        Review
      </div>

      <div
        className={tabBase}
        style={getTabStyle("analytics")}
        onClick={() => setActiveTab("analytics")}
      >
        Analytics
      </div>

      <div
        className={tabBase}
        style={getTabStyle("reports")}
        onClick={() => setActiveTab("reports")}
      >
        Reports
      </div>
    </div>
  );
}