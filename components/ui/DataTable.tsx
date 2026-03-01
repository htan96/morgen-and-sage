type Props = {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
};

export default function DataTable({
  headers,
  children,
  empty,
  emptyMessage = "No records found.",
}: Props) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <table className="w-full text-sm">
        <thead
          style={{
            background: "var(--hover)",
            color: "var(--text-muted)",
          }}
        >
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className={`px-4 py-3 ${
                  index === headers.length - 1
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {empty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-6 text-center"
                style={{ color: "var(--text-muted)" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}