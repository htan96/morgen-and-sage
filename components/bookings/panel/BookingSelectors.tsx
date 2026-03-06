type Tenant = {
  id: string;
  name: string;
};

type Kitchen = {
  id: string;
  name: string;
};

type Props = {
  tenantId: string | null;
  setTenantId: (v: string) => void;
  panelKitchenId: string | null;
  setPanelKitchenId: (v: string) => void;
  tenants: Tenant[];
  kitchens: Kitchen[];
  portalMode?: boolean;
};

export default function BookingSelectors({
  tenantId,
  setTenantId,
  panelKitchenId,
  setPanelKitchenId,
  tenants,
  kitchens,
  portalMode = false,
}: Props) {
  return (
    <>
      {/* Kitchen Selector */}
      <div>
        <label className="block text-sm mb-2">Kitchen</label>

        <select
          value={panelKitchenId ?? ""}
          onChange={(e) => setPanelKitchenId(e.target.value)}
          className="w-full rounded-lg px-3 py-2"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <option value="">Select kitchen</option>

          {kitchens.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tenant Selector (Admin Only) */}
      {!portalMode && (
        <div>
          <label className="block text-sm mb-2">Tenant</label>

          <select
            value={tenantId ?? ""}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-lg px-3 py-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            <option value="">Select tenant</option>

            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}