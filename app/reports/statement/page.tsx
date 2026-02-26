import { createClient } from "@/lib/supabase/server";

export default async function StatementPage(props: any) {
  const searchParams = await props.searchParams;

  const selectedOrg = searchParams?.org || "all";
  const selectedYear = searchParams?.year || "all";

  const supabase = await createClient();

  // Fetch completed documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("status", "completed");

  // Fetch organizations
  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name");

  if (!documents) return null;

  // Filter by org + year
  const filteredDocs = documents.filter((doc: any) => {
    if (!doc.document_date) return false;

    const year = new Date(doc.document_date)
      .getFullYear()
      .toString();

    if (selectedOrg !== "all" && doc.organization_id !== selectedOrg)
      return false;

    if (selectedYear !== "all" && year !== selectedYear)
      return false;

    return true;
  });

  // Group by organization
  const groupedByOrg: Record<string, any[]> = {};

  filteredDocs.forEach((doc: any) => {
    const orgName =
      organizations?.find((o: any) => o.id === doc.organization_id)?.name ||
      "Unknown Organization";

    if (!groupedByOrg[orgName]) groupedByOrg[orgName] = [];
    groupedByOrg[orgName].push(doc);
  });

  const grandTotal = filteredDocs.reduce(
    (sum: number, d: any) => sum + (d.amount || 0),
    0
  );

  return (
    <div
      style={{
        fontFamily: "Georgia, serif",
        background: "white",
        color: "#000",
        minHeight: "100vh",
        padding: "70px",
      }}
    >
      <div style={{ maxWidth: "850px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "50px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700 }}>
            Financial Statement
          </h1>
          <p style={{ fontSize: "12px", marginTop: "4px" }}>
            Generated: {new Date().toLocaleString()}
          </p>
        </div>

        {/* Organizations */}
        {Object.entries(groupedByOrg).map(([orgName, docs]) => {
          const orgTotal = (docs as any[]).reduce(
            (sum: number, d: any) => sum + (d.amount || 0),
            0
          );

          const categoryMap: Record<string, any[]> = {};

          (docs as any[]).forEach((doc: any) => {
            const key = doc.category || "Uncategorized";
            if (!categoryMap[key]) categoryMap[key] = [];
            categoryMap[key].push(doc);
          });

          return (
            <div key={orgName} style={{ marginBottom: "60px" }}>
              {/* Org Title */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  borderBottom: "1px solid #000",
                  paddingBottom: "6px",
                  marginBottom: "20px",
                }}
              >
                {orgName}
              </div>

              {/* Categories */}
              {Object.entries(categoryMap).map(([category, catDocs]) => {
                const catTotal = (catDocs as any[]).reduce(
                  (sum: number, d: any) => sum + (d.amount || 0),
                  0
                );

                return (
                  <div key={category} style={{ marginBottom: "25px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      {category}
                    </div>

                    {(catDocs as any[]).map((doc: any) => (
                      <div
                        key={doc.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          padding: "4px 0",
                        }}
                      >
                        <div style={{ width: "75%" }}>
                          {doc.document_date} — {doc.vendor_name}
                          {doc.is_depreciable && (
                            <span
                              style={{
                                marginLeft: "6px",
                                fontStyle: "italic",
                                fontSize: "11px",
                                opacity: 0.7,
                              }}
                            >
                              (Depreciable)
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            width: "25%",
                            textAlign: "right",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          ${Number(doc.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}

                    {/* Category Total */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderTop: "1px solid #999",
                        marginTop: "6px",
                        paddingTop: "6px",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      <div>Category Total</div>
                      <div>${catTotal.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}

              {/* Org Total */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  borderTop: "2px solid #000",
                  marginTop: "20px",
                  paddingTop: "8px",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                <div>Organization Total</div>
                <div>${orgTotal.toFixed(2)}</div>
              </div>
            </div>
          );
        })}

        {/* Grand Total */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: "3px double #000",
            paddingTop: "10px",
            fontWeight: 800,
            fontSize: "16px",
            marginTop: "40px",
          }}
        >
          <div>Grand Total</div>
          <div>${grandTotal.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}