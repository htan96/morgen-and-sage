type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
};

export default function SectionCard({
  title,
  subtitle,
  children,
}: Props) {
  return (
    <div
      className="rounded-2xl p-8 space-y-6"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-[var(--text)]">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}