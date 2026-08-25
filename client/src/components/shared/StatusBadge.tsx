const DEFAULT_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
}

/** Colored status pill, e.g. an order's status or a stock level. */
export function StatusBadge({ status, colorMap = DEFAULT_COLORS }: StatusBadgeProps) {
  const classes = colorMap[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium capitalize ${classes}`}>
      {status}
    </span>
  );
}
