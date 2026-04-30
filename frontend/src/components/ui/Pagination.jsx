export default function Pagination({ currentPage = 1, totalPages = 1, totalItems = 0, pageSize = 15, onChange }) {
  const safeTotalPages = Math.max(1, Number(totalPages || 1));
  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage || 1)), safeTotalPages);

  if (safeTotalPages <= 1) return null;

  const pages =
    safeTotalPages <= 7
      ? Array.from({ length: safeTotalPages }, (_, index) => index + 1)
      : [...new Set([1, safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, safeTotalPages])]
          .filter((page) => page >= 1 && page <= safeTotalPages)
          .sort((first, second) => first - second);
  const start = (safeCurrentPage - 1) * pageSize + 1;
  const end = Math.min(safeCurrentPage * pageSize, totalItems || safeCurrentPage * pageSize);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-muted">
        Menampilkan {start}-{end} dari {totalItems || end} data
      </p>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <button
          type="button"
          disabled={safeCurrentPage === 1}
          onClick={() => onChange?.(safeCurrentPage - 1)}
          className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        {pages.map((page, index) => {
          const previousPage = pages[index - 1];
          const hasGap = previousPage && page - previousPage > 1;

          return (
            <span key={page} className="inline-flex items-center gap-2">
              {hasGap ? <span className="text-xs font-bold text-muted">...</span> : null}
              <button
                type="button"
                onClick={() => onChange?.(page)}
                className={[
                  'min-w-9 rounded-xl border px-3 py-1.5 text-xs font-bold transition',
                  safeCurrentPage === page
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
          disabled={safeCurrentPage === safeTotalPages}
          onClick={() => onChange?.(safeCurrentPage + 1)}
          className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-muted transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
