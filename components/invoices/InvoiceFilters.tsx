"use client";

type Props = {
  invoices: any[];
  status: string;
  setStatus: (v: string) => void;
  tenant: string;
  setTenant: (v: string) => void;
  month: string;
  setMonth: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  portalMode?: boolean;
};

export default function InvoiceFilters({
  invoices,
  status,
  setStatus,
  tenant,
  setTenant,
  month,
  setMonth,
  search,
  setSearch,
  portalMode = false,
}: Props) {
  const uniqueTenants = Array.from(
    new Map(
      invoices
        .filter((i) => i.tenant?.id)
        .map((i) => [i.tenant.id, i.tenant.name])
    ).entries()
  );

  return (
    <div
      className="rounded-lg px-4 py-3 flex flex-wrap gap-2 items-center"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search invoices..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="px-3 py-1.5 rounded-md text-sm"
        style={{
          background: "var(--background)",
          border: "1px solid var(--border)",
        }}
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="px-3 py-1.5 rounded-md text-sm"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
        }}
      >
        <option value="all">All Status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="partial">Partial</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="void">Void</option>
      </select>

      {/* Tenant (ADMIN ONLY) */}
      {!portalMode && (
        <select
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          className="px-3 py-1.5 rounded-md text-sm"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          }}
        >
          <option value="all">All Tenants</option>

          {uniqueTenants.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      )}

      {/* Month */}
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="px-3 py-1.5 rounded-md text-sm"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
        }}
      >
        <option value="all">All Months</option>

        {Array.from({ length: 12 }).map((_, i) => (
          <option key={i} value={i.toString()}>
            {new Date(0, i).toLocaleString("default", {
              month: "long",
            })}
          </option>
        ))}
      </select>
    </div>
  );
}