"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DocumentsReports() {
  const supabase = createClient();

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
      <div className="px-4 py-6">
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
    <div className="space-y-6 md:space-y-8">

      {/* FILTER CARD */}
      <div
        className="
          p-4 md:p-6
          rounded-xl
          flex flex-col md:flex-row
          gap-4 md:gap-6
        "
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Organization */}
        <div className="flex-1">
          <label className="text-sm opacity-70">
            Organization
          </label>
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full mt-1 px-4 py-2 rounded-lg"
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

        {/* Year */}
        <div className="flex-1">
          <label className="text-sm opacity-70">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full mt-1 px-4 py-2 rounded-lg"
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

        {/* Button */}
        <div className="flex md:items-end">
          <button
            onClick={handleGenerate}
            className="
              w-full md:w-auto
              px-5 py-2
              rounded-lg
            "
            style={{
              background: "#111827",
              color: "#fff",
            }}
          >
            Generate Statement
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="text-sm opacity-70 px-1 md:px-0">
        Generate a clean financial statement grouped by
        Organization and Category. The report will open in a
        dedicated print-ready view.
      </div>

    </div>
  );
}