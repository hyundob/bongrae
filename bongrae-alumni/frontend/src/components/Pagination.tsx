"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages < 2) return null;
  return (
    <nav className="pagination" aria-label="페이지 이동">
      <button
        className="icon-button"
        title="이전 페이지"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
      </button>
      <span>
        {page + 1} / {pages}
      </span>
      <button
        className="icon-button"
        title="다음 페이지"
        disabled={page + 1 >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
