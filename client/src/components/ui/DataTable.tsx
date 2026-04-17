import { GlassCard } from "./GlassCard";

interface Column {
  header: string;
  accessor: string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onRowClick?: (row: any) => void;
  compact?: boolean;
}

export function DataTable({ columns, data, onRowClick, compact }: DataTableProps) {
  return (
    <GlassCard noPadding className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#17181c] text-[10px] uppercase tracking-wider text-[#9da1a8]">
            <tr>
              {columns.map((col) => (
                <th key={col.accessor} className={`px-4 ${compact ? 'py-2' : 'py-3'} font-semibold border-b border-white/[0.06]`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(row)}
                className="border-b border-white/[0.04] bg-transparent hover:bg-white/[0.03] transition-colors cursor-pointer group"
              >
                {columns.map((col) => (
                  <td key={col.accessor} className={`px-4 ${compact ? 'py-2' : 'py-3'} whitespace-nowrap text-[#9da1a8]`}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
