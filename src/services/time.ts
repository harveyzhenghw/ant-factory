export type TimeLike = number | string | null | undefined;

/**
 * Normalize a Firebase-stored timestamp (which may be an epoch number, an ISO
 * string, or missing) into epoch milliseconds. Falls back to `now` so the UI
 * never renders "Invalid Date".
 */
export function toEpoch(value: TimeLike, now: number = Date.now()): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return now;
}
