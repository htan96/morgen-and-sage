"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Document = {
  id: string;
  amount: number | null;
  category: string | null;
  organization_id: string | null;
  vendor_name: string | null;
  is_depreciable: boolean | null;
  status: string;
};

export default function DocumentsAnalytics() {
  const supabase = createClient();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("status", "completed");

      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name");

      setDocuments(docs || []);
      setOrganizations(orgs || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading)
    return <div className="px-3 py-5">Loading analytics...</div>;

  const filteredDocs =
    selectedOrg === "all"
      ? documents
      : documents.filter(d => d.organization_id === selectedOrg);

  const totalSpend = filteredDocs.reduce(
    (sum, d) => sum + (d.amount || 0),
    0
  );

  const depreciableTotal = filteredDocs
    .filter(d => d.is_depreciable)
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const averageAmount =
    filteredDocs.length > 0
      ? totalSpend / filteredDocs.length
      : 0;

  const docCount = filteredDocs.length;

  const categoryMap: Record<string, number> = {};
  filteredDocs.forEach(doc => {
    const key = doc.category || "Uncategorized";
    categoryMap[key] =
      (categoryMap[key] || 0) + (doc.amount || 0);
  });

  const vendorMap: Record<string, number> = {};
  filteredDocs.forEach(doc => {
    const vendor = doc.vendor_name || "Unknown Vendor";
    vendorMap[vendor] =
      (vendorMap[vendor] || 0) + (doc.amount || 0);
  });

  return (
    <div className="space-y-5 md:space-y-10">

      {/* FILTER */}
      <div
        className="p-3 sm:p-4 md:p-6 rounded-xl"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)"
        }}
      >
        <label className="block text-xs md:text-sm mb-1 opacity-70">
          Filter by Organization
        </label>

        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full md:w-auto px-3 py-2 rounded-lg text-sm"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)"
          }}
        >
          <option value="all">All Organizations</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 md:gap-6">
        <AnalyticsCard label="Total Spend" value={`$${totalSpend.toFixed(2)}`} />
        <AnalyticsCard label="Depreciable" value={`$${depreciableTotal.toFixed(2)}`} />
        <AnalyticsCard label="Average" value={`$${averageAmount.toFixed(2)}`} />
        <AnalyticsCard label="Count" value={docCount} />
      </div>

      {/* CATEGORY BREAKDOWN */}
      <Section title="Spend by Category">
        {Object.entries(categoryMap).map(([cat, amount]) => (
          <Row key={cat} label={cat} value={`$${amount.toFixed(2)}`} />
        ))}
      </Section>

      {/* VENDOR BREAKDOWN */}
      <Section title="Spend by Vendor">
        {Object.entries(vendorMap).map(([vendor, amount]) => (
          <Row key={vendor} label={vendor} value={`$${amount.toFixed(2)}`} />
        ))}
      </Section>
    </div>
  );
}

function AnalyticsCard({ label, value }: { label: string; value: any }) {
  return (
    <div
      className="p-3 sm:p-4 md:p-6 rounded-xl"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)"
      }}
    >
      <div className="text-[11px] md:text-sm opacity-70">
        {label}
      </div>
      <div className="text-base sm:text-lg md:text-2xl font-bold mt-1">
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <div
      className="p-3 sm:p-4 md:p-6 rounded-xl space-y-2 md:space-y-4"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)"
      }}
    >
      <h2 className="text-sm md:text-lg font-semibold">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs sm:text-sm md:text-base">
      <span className="truncate">{label}</span>
      <span className="font-semibold ml-3">{value}</span>
    </div>
  );
}