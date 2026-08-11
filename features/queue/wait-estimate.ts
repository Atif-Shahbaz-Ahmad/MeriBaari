/**
 * Centralized wait estimate helpers for queue UX.
 * estimatedWait ≈ peopleAhead × averageServiceTime
 */

export function estimateWaitMinutes(
  peopleAhead: number,
  averageServiceTime: number,
): number {
  const ahead = Math.max(0, peopleAhead);
  const avg = Math.max(1, averageServiceTime || 10);
  return ahead * avg;
}

export function peopleAheadFromPosition(position: number): number {
  return Math.max(0, position - 1);
}
