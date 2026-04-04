export function toMinorUnits(amount: number) {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Amount must be a non-negative finite number.");
  }

  return Math.round(amount * 100);
}
