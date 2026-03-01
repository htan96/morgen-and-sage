import { TenantService } from "./types";
import TenantServiceRow from "./TenantServiceRow";

type Props = {
  tenantServices: TenantService[];
  onUpdate: (
    id: string,
    amount: number,
    frequency: string,
    quantity: number
  ) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, current: boolean) => void;
};

export default function TenantServicesTable({
  tenantServices,
  onUpdate,
  onDelete,
  onToggleStatus,
}: Props) {
  return (
    <div className="ui-table-wrapper">
      <table className="w-full text-sm">
        <thead className="ui-table-head">
          <tr>
            <th className="px-6 py-4 text-left">Service</th>
            <th className="px-6 py-4 text-left">Amount</th>
            <th className="px-6 py-4 text-left">Frequency</th>
            <th className="px-6 py-4 text-left">Qty</th>
            <th className="px-6 py-4 text-left">Status</th>
            <th className="px-6 py-4 text-right"></th>
          </tr>
        </thead>

        <tbody>
          {tenantServices.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="ui-table-empty"
              >
                No services configured.
              </td>
            </tr>
          )}

          {tenantServices.map((item) => (
            <TenantServiceRow
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}