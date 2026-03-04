type Props = {
  isEditMode: boolean;
  title?: string;
};

export default function BookingPanelHeader({
  isEditMode,
  title,
}: Props) {
  return (
    <div
      className="p-6 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="text-lg font-semibold">
        {title
          ? title
          : isEditMode
          ? "Edit Booking"
          : "Create Booking"}
      </h2>
    </div>
  );
}