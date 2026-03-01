"use client";

import { useState } from "react";
import TenantHeader from "./TenantHeader";
import OverviewTab from "./tabs/OverviewTab";
import RatesTab from "./tabs/Rates/RatesTab";
import PresetScheduleTab from "./tabs/PresetSchedule/PresetScheduleTab";
import BookingsTab from "./tabs/BookingsTab";
import InvoicesTab from "./tabs/InvoicesTab";

type Props = {
  tenant: any;
};

export default function TenantView({ tenant }: Props) {
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "rates", label: "Rates" },
    { id: "schedule", label: "Recurring Schedule" },
    { id: "bookings", label: "Bookings" },
    { id: "invoices", label: "Invoices" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <TenantHeader tenant={tenant} />

      {/* Tabs Container */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl">

        {/* Tab Buttons */}
        <div className="flex gap-6 px-6 pt-6 border-b border-[var(--border)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm transition ${
                activeTab === tab.id
                  ? "text-[var(--text)] border-b-2 border-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <OverviewTab tenantId={tenant.id} />
          )}

          {activeTab === "rates" && (
            <RatesTab tenantId={tenant.id} />
          )}

          {activeTab === "schedule" && (
            <PresetScheduleTab tenantId={tenant.id} />
          )}

          {activeTab === "bookings" && (
            <BookingsTab tenantId={tenant.id} />
          )}

          {activeTab === "invoices" && (
            <InvoicesTab tenantId={tenant.id} />
          )}
        </div>

      </div>
    </div>
  );
}