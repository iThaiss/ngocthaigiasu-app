export function isVipActive(
  isVip: boolean | null | undefined,
  expiresAt: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!isVip) return false

  // Keep legacy/lifetime VIP accounts active when they intentionally have no expiry.
  if (!expiresAt) return true

  const expiryTime = new Date(expiresAt).getTime()
  return Number.isFinite(expiryTime) && expiryTime > now
}
