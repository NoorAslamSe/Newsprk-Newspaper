"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl, className = "" }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', page.toString());
    }
    const queryString = params.toString();
    return `${baseUrl}${queryString ? `?${queryString}` : ''}`;
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center gap-1.5 sm:gap-2 mt-10 ${className}`}>
      {/* Previous button */}
      {currentPage > 1 && (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--round-5)] text-sm font-semibold bg-[var(--flex-gray-7)] hover:bg-[var(--g-color)] hover:text-white transition-colors flex items-center justify-center"
        >
          ‹
        </Link>
      )}

      {/* Page numbers */}
      {visiblePages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`dots-${index}`}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-sm text-[var(--meta-fcolor)]"
            >
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <Link
            key={pageNum}
            href={createPageUrl(pageNum)}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--round-5)] text-sm font-semibold transition-colors flex items-center justify-center ${
              isActive
                ? "bg-[var(--g-color)] text-white"
                : "bg-[var(--flex-gray-7)] text-[var(--body-fcolor)] hover:bg-[var(--g-color)] hover:text-white"
            }`}
          >
            {pageNum}
          </Link>
        );
      })}

      {/* Next button */}
      {currentPage < totalPages && (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-[var(--round-5)] text-sm font-semibold bg-[var(--flex-gray-7)] hover:bg-[var(--g-color)] hover:text-white transition-colors flex items-center justify-center"
        >
          ›
        </Link>
      )}
    </div>
  );
}