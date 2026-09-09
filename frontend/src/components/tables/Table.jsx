import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SkeletonRow } from '../common/Loader';
import EmptyState from '../common/EmptyState';

export function Table({
  columns = [],
  data = [],
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
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

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleSort(col.key, col.sortable)}
                    className={`px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-600 select-none ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''
                    } ${col.headerClassName || ''}`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.title}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortOrder === 'ASC' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-brand-600" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-brand-600" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm text-slate-700 bg-white">
            {isLoading ? (
              <>
                <SkeletonRow cols={columns.length} />
                <SkeletonRow cols={columns.length} />
                <SkeletonRow cols={columns.length} />
                <SkeletonRow cols={columns.length} />
                <SkeletonRow cols={columns.length} />
              </>
            ) : data.length > 0 ? (
              data.map((row, rowIndex) => (
                <tr
                  key={row[rowKey] || rowIndex}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 whitespace-nowrap ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row, rowIndex) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
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
