export const FIRST_CONTACT_SLA_MS = 4 * 60 * 60 * 1000;
export const VISIT_FOLLOW_UP_MS = 24 * 60 * 60 * 1000;
export const JOB_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000;
export const AUTO_APPROVAL_DISCOUNT_BPS = 500;

export function discountBps(listPrice: number, offeredPrice: number) {
  if (!Number.isInteger(listPrice) || listPrice <= 0 || !Number.isInteger(offeredPrice) || offeredPrice <= 0) {
    throw new Error("Prices must be positive integers");
  }
  return Math.max(0, Math.round(((listPrice - offeredPrice) * 10_000) / listPrice));
}

export function offerNeedsApproval(listPrice: number, offeredPrice: number) {
  return discountBps(listPrice, offeredPrice) > AUTO_APPROVAL_DISCOUNT_BPS;
}

export function nextRoundRobinUser<T extends { id: string }>(users: T[], lastAssignedUserId?: string | null) {
  if (users.length === 0) return null;
  const lastIndex = users.findIndex((user) => user.id === lastAssignedUserId);
  return users[(lastIndex + 1) % users.length];
}

export function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds);
}
