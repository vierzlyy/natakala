import { useEffect, useMemo, useState } from 'react';

export default function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'Belum ada data.',
  rowClassName,
  pageSize = 15,
  pagination = true,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const shouldPaginate = pagination && data.length > 0;
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length, pageSize]);

  const visibleData = useMemo(() => {
    if (!shouldPaginate) return data;

    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [currentPage, data, pageSize, shouldPaginate]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    return [...pages]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((first, second) => first - second);
  }, [currentPage, totalPages]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-white">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-line">
          <thead className="bg-surface">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-muted"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-xs text-muted">
                  Memuat data...
                </td>
              </tr>
            ) : data.length ? (
              visibleData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={['align-top transition', typeof rowClassName === 'function' ? rowClassName(row, index) : rowClassName || ''].join(' ')}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-2 text-xs text-text">
                      {column.render ? column.render(row, index) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {shouldPaginate ? (
        <div className="flex flex-col gap-3 border-t border-line bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-semibold text-muted">
            Menampilkan {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, data.length)} dari {data.length} data
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Prev
            </button>
            {pageNumbers.map((page, index) => {
              const previousPage = pageNumbers[index - 1];
              const hasGap = previousPage && page - previousPage > 1;

              return (
                <span key={page} className="inline-flex items-center gap-2">
                  {hasGap ? <span className="text-xs font-bold text-muted">...</span> : null}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={[
                      'min-w-9 rounded-xl border px-3 py-1.5 text-xs font-bold transition',
                      currentPage === page
                        ? 'border-primary bg-primary text-white'
                        : 'border-line bg-white text-muted hover:border-primary hover:text-primary',
                    ].join(' ')}
                  >
                    {page}
                  </button>
                </span>
              );
            })}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
