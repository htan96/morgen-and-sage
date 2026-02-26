import DocumentCard from "./DocumentCard";

type Props = {
  documents: any[];
};

export default function DocumentsGrid({ documents }: Props) {
  if (!documents || documents.length === 0) {
    return (
      <div
        className="rounded-xl p-6 md:p-10 text-center"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        No documents found.
      </div>
    );
  }

  return (
    <div
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        gap-4
        md:gap-6
      "
    >
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}