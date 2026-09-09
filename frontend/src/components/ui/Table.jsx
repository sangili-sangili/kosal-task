import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { TableSkeleton } from './Skeleton';
import EmptyState from './EmptyState';

export function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No data available',
  emptyDescription = 'No records match your criteria.',
  emptyActionLabel = null,
  onEmptyAction = null,
  sortBy = '',
  sortOrder = 'DESC',
  onSort = null,
  rowKey = 'id',
}) {
  const handleSort = (columnKey, isSortable) => {
    if (!isSortable || !onSort) return;
    const newOrder = sortBy === columnKey && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSort(columnKey, newOrder);
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={columns.length} />;
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-subtle">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 select-none ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/70 transition-colors' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>{col.title}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortOrder === 'ASC' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-900" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-slate-300" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700 bg-white">
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={row[rowKey] || rowIndex}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3.5 whitespace-nowrap ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
