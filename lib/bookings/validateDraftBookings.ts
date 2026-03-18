const MIN_DURATION_HOURS = 4;
const SLOT_MINUTES = 15;

type DraftBooking = {
  id: string;
  startTime: string;
  endTime: string;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

function isOnFifteenMinBoundary(date: Date): boolean {
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  return minutes % SLOT_MINUTES === 0 && seconds === 0;
}

export function validateDraftBookings(
  drafts: DraftBooking[]
): ValidationResult {
  if (drafts.length === 0) {
    return { valid: false, error: "Add at least one booking." };
  }

  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const start = new Date(d.startTime);
    const end = new Date(d.endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, error: `Booking ${i + 1}: Invalid date format.` };
    }

    if (end.getTime() <= start.getTime()) {
      return { valid: false, error: `Booking ${i + 1}: End time must be after start time.` };
    }

    const durationHours =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours < MIN_DURATION_HOURS) {
      return {
        valid: false,
        error: `Booking ${i + 1}: Minimum duration is ${MIN_DURATION_HOURS} hours.`,
      };
    }

    if (!isOnFifteenMinBoundary(start)) {
      return {
        valid: false,
        error: `Booking ${i + 1}: Start time must be on a 15-minute boundary (e.g. 9:00, 9:15).`,
      };
    }

    if (!isOnFifteenMinBoundary(end)) {
      return {
        valid: false,
        error: `Booking ${i + 1}: End time must be on a 15-minute boundary (e.g. 13:00, 13:15).`,
      };
    }
  }

  for (let i = 0; i < drafts.length; i++) {
    for (let j = i + 1; j < drafts.length; j++) {
      const aStart = new Date(drafts[i].startTime);
      const aEnd = new Date(drafts[i].endTime);
      const bStart = new Date(drafts[j].startTime);
      const bEnd = new Date(drafts[j].endTime);

      if (aStart < bEnd && aEnd > bStart) {
        return {
          valid: false,
          error: "Time slots overlap. Each booking must be on separate days or non-overlapping times.",
        };
      }
    }
  }

  return { valid: true };
}
