/** Days until a trashed code is purged (30-day window). */
export function trashDaysLeft(deletedAt: string): number {
  return Math.max(0, 30 - Math.floor((Date.now() - new Date(deletedAt).getTime()) / 86_400_000));
}

/** Date `daysAgo` days before now. */
export function daysAgo(daysAgo: number): Date {
  return new Date(Date.now() - daysAgo * 86_400_000);
}
