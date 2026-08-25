import { useMemo, useState, type ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T extends { id: number | string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  selectedId?: number | string | null;
  emptyMessage?: string;
}

/** Reusable sortable table with click-to-select rows. Sorting is client-side. */
export function DataTable<T extends { id: number | string }>({
  columns,
  rows,
  onRowClick,
  selectedId,
  emptyMessage = 'No data',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      const result = (aVal as string | number) > (bVal as string | number) ? 1 : -1;
      return sortAsc ? result : -result;
    });
  }, [rows, sortKey, sortAsc]);

  function toggleSort(key: keyof T): void {
    if (sortKey === key) {
      setSortAsc((asc) => !asc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  if (rows.length === 0) {
    return <p className="p-4 text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={String(col.key)}
              onClick={() => toggleSort(col.key)}
              className="cursor-pointer select-none px-3 py-2 text-left text-xs uppercase tracking-wider text-slate-500"
            >
              {col.header}
              {sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => (
          <tr
            key={row.id}
            onClick={() => onRowClick?.(row)}
            className={`cursor-pointer border-t border-slate-200 hover:bg-slate-50 ${
              selectedId === row.id ? 'bg-blue-50' : ''
            }`}
          >
            {columns.map((col) => (
              <td key={String(col.key)} className="px-3 py-2 tabular-nums">
                {col.render ? col.render(row) : String(row[col.key] ?? '')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
