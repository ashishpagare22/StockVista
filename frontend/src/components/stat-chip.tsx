type StatChipProps = {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
};

export function StatChip({ label, value, tone = "neutral" }: StatChipProps) {
  return (
    <div className={`stat-chip stat-chip--${tone}`}>
      <span className="stat-chip__label">{label}</span>
      <strong className="stat-chip__value">{value}</strong>
    </div>
  );
}
