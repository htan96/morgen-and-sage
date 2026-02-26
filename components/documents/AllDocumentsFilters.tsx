"use client";

type Props = {
  search: string;
  setSearch: (value: string) => void;

  status: string;
  setStatus: (value: string) => void;

  category: string;
  setCategory: (value: string) => void;

  organizationId: string;
  setOrganizationId: (value: string) => void;

  organizations: any[];
};

export default function AllDocumentsFilters({
  search,
  setSearch,
  status,
  setStatus,
  category,
  setCategory,
  organizationId,
  setOrganizationId,
  organizations,
}: Props) {
  return (
    <div
      className="
        rounded-xl
        p-3 sm:p-4 md:p-5
        flex flex-col
        md:flex-row
        gap-3 md:gap-4
      "
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Search */}
      <input
        type="text"
        placeholder="Search vendor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-auto px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />

      {/* Status */}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full md:w-auto px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <option value="">All Status</option>
        <option value="processing">Processing</option>
        <option value="review">Review</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Category */}
      <input
        type="text"
        placeholder="Category..."
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full md:w-auto px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />

      {/* Organization */}
      <select
        value={organizationId}
        onChange={(e) => setOrganizationId(e.target.value)}
        className="w-full md:w-auto px-3 py-2 rounded-lg text-sm"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      >
        <option value="">All Organizations</option>

        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>

      {/* Clear Button */}
      <button
        onClick={() => {
          setSearch("");
          setStatus("");
          setCategory("");
          setOrganizationId("");
        }}
        className="
          w-full md:w-auto
          px-3 py-2
          rounded-lg
          text-sm
        "
        style={{
          background: "var(--hover)",
          border: "1px solid var(--border)",
        }}
      >
        Clear
      </button>
    </div>
  );
}