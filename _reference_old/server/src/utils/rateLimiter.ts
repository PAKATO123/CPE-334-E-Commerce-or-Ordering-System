const COOLDOWN_MS = 15 * 1000; // 15 seconds (BR-18)
const lastTicketTimestamps = new Map<number, number>();

/**
 * Returns true if requester is rate-limited (created a ticket < 15s ago).
 */
export function isRateLimited(requesterId: number): boolean {
  const lastTime = lastTicketTimestamps.get(requesterId);
  if (!lastTime) return false;
  return Date.now() - lastTime < COOLDOWN_MS;
}

/**
 * Records a ticket creation timestamp for the requester.
 */
export function recordTicketCreation(requesterId: number): void {
  lastTicketTimestamps.set(requesterId, Date.now());
}

/**
 * Resets rate limit map (useful for test suites).
 */
export function resetRateLimits(): void {
  lastTicketTimestamps.clear();
}
