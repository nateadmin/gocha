export function otherAccountUnreadIds(
  accounts: { userId: number }[],
  activeAccountId: number | null,
  unreadByUserId: Record<number, boolean>,
): number[] {
  return accounts
    .filter((account) => account.userId !== activeAccountId && unreadByUserId[account.userId] === true)
    .map((account) => account.userId);
}

export function shouldShowAccountLogoBadge(otherUnreadIds: number[]): boolean {
  return otherUnreadIds.length > 0;
}

export function unreadMapsEqual(
  left: Record<number, boolean>,
  right: Record<number, boolean>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  return leftKeys.every((key) => left[Number(key)] === right[Number(key)]);
}
