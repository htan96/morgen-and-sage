"use client";

import { useEffect, useState } from "react";
import DocumentsGrid from "./DocumentsGrid";
import AllDocumentsFilters from "./AllDocumentsFilters";
import KpiCard from "./KpiCard";
import { createClient } from "@/lib/supabase/client";

export default function AllDocumentsView() {
  const supabase = createClient();

  const [documents, setDocuments] = useState<any[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [organizationId, setOrganizationId] = useState("");

  useEffect(() => {
    async function fetchData() {
      // ✅ Proper relational join syntax
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          organizations:organization_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Documents fetch error:", error);
      }

      if (data) {
        console.log("Documents data:", data); // DEBUG
        setDocuments(data);
        setFilteredDocuments(data);
      }

      if (orgData) {
        setOrganizations(orgData);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...documents];

    if (search) {
      filtered = filtered.filter((doc) =>
        doc.vendor_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      filtered = filtered.filter((doc) => doc.status === status);
    }

    if (category) {
      filtered = filtered.filter((doc) =>
        doc.category?.toLowerCase().includes(category.toLowerCase())
      );
    }

    if (organizationId) {
      filtered = filtered.filter(
        (doc) => doc.organization_id === organizationId
      );
    }

    setFilteredDocuments(filtered);
  }, [search, status, category, organizationId, documents]);

  if (loading) {
    return (
      <div
        className="rounded-xl p-8 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        Loading documents...
      </div>
    );
  }

  const totalAmount = filteredDocuments
    .reduce((sum, d) => sum + Number(d.amount || 0), 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      {/* KPI ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Total Docs" value={filteredDocuments.length} />
        <KpiCard
          label="Review"
          value={filteredDocuments.filter(d => d.status === "review").length}
        />
        <KpiCard
          label="Processing"
          value={filteredDocuments.filter(d => d.status === "processing").length}
        />
        <KpiCard
          label="Approved"
          value={filteredDocuments.filter(d => d.status === "approved").length}
        />
        <KpiCard label="Total Amount" value={`$${totalAmount}`} />
      </div>

      {/* FILTERS */}
      <AllDocumentsFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        category={category}
        setCategory={setCategory}
        organizationId={organizationId}
        setOrganizationId={setOrganizationId}
        organizations={organizations}
      />

      {/* GRID */}
      <DocumentsGrid documents={filteredDocuments} />
    </div>
  );
}