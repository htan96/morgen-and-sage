type Props = {
  active: boolean;
  onToggle: () => void;
};

export default function StatusToggle({ active, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className="relative inline-flex items-center w-11 h-6 transition"
      style={{
        background: active ? "#16a34a" : "var(--border)",
        borderRadius: "999px",
      }}
    >
      <span
        className="absolute w-5 h-5 bg-white rounded-full transition"
        style={{
          left: active ? "22px" : "2px",
        }}
      />
    </button>
  );
}