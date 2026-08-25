const TONE_CLASSES = {
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
} as const;

interface AlertCardProps {
  label: string;
  count: number;
  tone?: keyof typeof TONE_CLASSES;
}

/** Compact alert row used in *Alerts panels (Sales, Inventory). Hides itself when count is 0. */
export function AlertCard({ label, count, tone = 'info' }: AlertCardProps) {
  if (count === 0) return null;
  return (
    <div className={`flex items-center justify-between rounded border px-2 py-1 text-xs ${TONE_CLASSES[tone]}`}>
      <span>{label}</span>
      <span className="font-semibold tabular-nums">{count}</span>
    </div>
  );
}
