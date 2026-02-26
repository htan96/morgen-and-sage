"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DocumentsReports() {
  const supabase = createClient();
  const router = useRouter();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");

      const { data: docs } = await supabase
        .from("documents")
        .select("document_date")
        .not("document_date", "is", null);

      setOrganizations(orgs || []);
      setDocuments(docs || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading report filters...
      </div>
    );
  }

  const availableYears = Array.from(
    new Set(
      documents.map((d) =>
        new Date(d.document_date)
          .getFullYear()
          .toString()
      )
    )
  ).sort();

  const handleGenerate = () => {
  window.open(
    `/reports/statement?org=${selectedOrg}&year=${selectedYear}`,
    "_blank"
  );
};

  return (
    <div className="space-y-8">

      {/* FILTER CARD */}
      <div
        className="p-6 rounded-xl flex gap-6 items-end"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Organization Filter */}
        <div>
          <label className="text-sm opacity-70">
            Organization
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="mt-1 px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <option value="all">All</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <label className="text-sm opacity-70">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="mt-1 px-4 py-2 rounded-lg"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <option value="all">All</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          className="px-5 py-2 rounded-lg ml-auto"
          style={{
            background: "#111827",
            color: "#fff",
          }}
        >
          Generate Statement
        </button>
      </div>

      {/* Optional Description */}
      <div className="text-sm opacity-70">
        Generate a clean financial statement grouped by
        Organization and Category. The report will open in a
        dedicated print-ready view.
      </div>
    </div>
  );
}