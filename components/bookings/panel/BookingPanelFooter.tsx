type Props = {
  onSubmit: () => void;
  disabled: boolean;
  isEditMode: boolean;
  loading: boolean;
  label?: string;
  secondaryAction?: () => void;
};

export default function BookingPanelFooter({
  onSubmit,
  disabled,
  isEditMode,
  loading,
  label,
  secondaryAction,
}: Props) {
  return (
    <div
      className="p-6 border-t space-y-3"
      style={{ borderColor: "var(--border)" }}
    >
      {secondaryAction && (
        <button
          onClick={secondaryAction}
          className="w-full py-2 rounded-lg text-sm"
          style={{
            border: "1px solid var(--border)",
            background: "transparent",
          }}
        >
          Back to Edit
        </button>
      )}

      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-full py-3 rounded-lg font-medium"
        style={{
          background: "var(--text)",
          color: "var(--bg)",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        {loading
          ? "Processing..."
          : label
          ? label
          : isEditMode
          ? "Update Booking"
          : "Submit"}
      </button>
    </div>
  );
}