"use client";

import { useRouter } from "next/navigation";
import { Tenant } from "../../../app/admin/tenants/page";

export default function TenantCard({ tenant }: { tenant: Tenant }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
      className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 transition hover:bg-[var(--hover)]"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">
            {tenant.name}
          </h3>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Created {new Date(tenant.created_at).toLocaleDateString()}
          </p>
        </div>

<span
  className={`text-xs px-2.5 py-1 rounded-full 
  ${
    tenant.billing_type === "commissary"
      ? "bg-[var(--hover)] text-[var(--text)]"
      : "bg-[var(--hover)]/60 text-[var(--text-muted)]"
  }`}
>
  {tenant.billing_type === "commissary"
    ? "Commissary"
    : "Standard"}
</span>
      </div>

      <div className="mt-6 text-sm font-medium text-[var(--text)]">
        View Details →
      </div>
    </div>
  );
}