"use client";

import BillingTypeSelector from "./BillingTypeSelector";

type Props = {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  billingType: "standard" | "commissary";
  active: boolean;
  onChange: (field: string, value: any) => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[var(--border)] pb-8 mb-8 last:border-none last:mb-0">
      <div className="px-8">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-6">
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
}

export default function TenantForm({
  name,
  contactName,
  email,
  phone,
  billingType,
  active,
  onChange,
}: Props) {
  return (
    <div>

      {/* Business Info */}
      <Section title="Business Information">
        <div className="space-y-4">
          <input
            placeholder="Business Name"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />

          <div>
            <div className="text-xs font-medium text-[var(--text-muted)] mb-1.5">
              Contact Name
            </div>
            <input
              placeholder="Enter primary contact name"
              value={contactName}
              onChange={(e) => onChange("contact_name", e.target.value)}
              className="w-full px-4 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
            />
          </div>

          <input
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => onChange("email", e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />

          <input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="w-full px-4 py-2.5 rounded-md border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition"
          />
        </div>
      </Section>

      {/* Billing Type */}
      <Section title="Billing Type">
        <BillingTypeSelector
          value={billingType}
          onChange={(value) => onChange("billingType", value)}
        />
      </Section>

      {/* Status */}
      <Section title="Status">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-[var(--text)]">
              Active Tenant
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-1">
              Inactive tenants remain in the system but won’t be billed.
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange("active", !active)}
            className={`relative w-12 h-7 rounded-full border transition ${
              active
                ? "bg-[var(--primary)] border-[var(--primary)]"
                : "bg-[var(--bg)] border-[var(--border)]"
            }`}
          >
            <div
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                active ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </Section>

    </div>
  );
}