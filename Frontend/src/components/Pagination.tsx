interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

// The page numbers to show: all of them when there are few, otherwise
// the first, the last and the pages around the current one, with "..." between
function getPageNumbers(page: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(totalPages - 1, page + 1);

  if (from > 2) pages.push("...");
  for (let p = from; p <= to; p++) pages.push(p);
  if (to < totalPages - 1) pages.push("...");

  pages.push(totalPages);
  return pages;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page">
        ‹
      </button>

      {getPageNumbers(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} className="page-dots">...</span>
        ) : (
          <button key={p} className={p === page ? "page-btn current" : "page-btn"} onClick={() => onChange(p)}>
            {p}
          </button>
        )
      )}

      <button className="page-btn" onClick={() => onChange(page + 1)} disabled={page === totalPages} aria-label="Next page">
        ›
      </button>
    </div>
  );
}
