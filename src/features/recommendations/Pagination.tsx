import React from "react";
import { cn } from "../../lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const range = 2;
  const pages = [];

  for (
    let i = Math.max(1, currentPage - range);
    i <= Math.min(totalPages, currentPage + range);
    i++
  ) {
    pages.push(i);
  }

  const PageBtn = ({
    page,
    active,
    children,
  }: {
    page: number;
    active?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => onPageChange(page)}
      className={cn(
        "font-space text-[0.75rem] px-[0.9rem] py-2 bg-brand-surface border border-brand-border text-brand-muted rounded-[4px] cursor-pointer transition-all duration-200 hover:border-brand-pink hover:text-brand-text",
        active && "bg-brand-pink text-white border-brand-pink"
      )}
    >
      {children}
    </button>
  );

  const Ellipsis = () => (
    <span className="text-brand-muted px-1 py-2 flex items-center justify-center">
      …
    </span>
  );

  return (
    <div className="flex justify-center gap-2 mt-10 flex-wrap">
      {currentPage > 1 && (
        <PageBtn page={currentPage - 1}>← Prev</PageBtn>
      )}

      {pages[0] > 1 && (
        <>
          <PageBtn page={1}>1</PageBtn>
          {pages[0] > 2 && <Ellipsis />}
        </>
      )}

      {pages.map((p) => (
        <PageBtn key={p} page={p} active={p === currentPage}>
          {p}
        </PageBtn>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <Ellipsis />}
          <PageBtn page={totalPages}>{totalPages}</PageBtn>
        </>
      )}

      {currentPage < totalPages && (
        <PageBtn page={currentPage + 1}>Next →</PageBtn>
      )}
    </div>
  );
}
