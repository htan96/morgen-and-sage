type DraftBooking = {
  id: string;
  startTime: string;
  endTime: string;
};

type Props = {
  draftBookings: DraftBooking[];
  updateDraft: (id: string, updates: Partial<DraftBooking>) => void;
  removeDraft: (id: string) => void;
  addNextDayDraft: () => void;
};

export default function DraftBookingList({
  draftBookings,
  updateDraft,
  removeDraft,
  addNextDayDraft,
}: Props) {
  return (
    <>
      {draftBookings.map((draft) => (
        <div
          key={draft.id}
          className="p-4 rounded-lg space-y-3"
          style={{ border: "1px solid var(--border)" }}
        >
          <input
            type="datetime-local"
            value={draft.startTime}
            onChange={(e) =>
              updateDraft(draft.id, { startTime: e.target.value })
            }
            className="w-full rounded-lg px-3 py-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          />

          <input
            type="datetime-local"
            value={draft.endTime}
            onChange={(e) =>
              updateDraft(draft.id, { endTime: e.target.value })
            }
            className="w-full rounded-lg px-3 py-2"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          />

          <button
            onClick={() => removeDraft(draft.id)}
            className="text-sm"
            style={{ color: "#ef4444" }}
          >
            Remove
          </button>
        </div>
      ))}

      {draftBookings.length > 0 && (
        <button
          onClick={addNextDayDraft}
          className="w-full py-2 rounded-lg text-sm"
          style={{ border: "1px dashed var(--border)" }}
        >
          + Add Next Day (9AM–1PM)
        </button>
      )}
    </>
  );
}