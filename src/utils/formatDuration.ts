export function formatDuration(ms: number): string {
  if (ms <= 0) return "0 seconds";

  const seconds = Math.floor(ms / 1000);

  const units = [
    { label: "day", value: 60 * 60 * 24 },
    { label: "hour", value: 60 * 60 },
    { label: "minute", value: 60 },
    { label: "second", value: 1 },
  ];

  for (const unit of units) {
    const amount = Math.floor(seconds / unit.value);
    if (amount >= 1) {
      return `${amount} ${unit.label}${amount > 1 ? "s" : ""}`;
    }
  }

  return "0 seconds";
}
