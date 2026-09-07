"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArticleListItem from "./ArticleListItem";

interface AdOverride {
  position: string;
  adSnippetId: string;
  width?: number;
  height?: number;
}

interface Article {
  _id: string;
  slug: string;
  title: string;
  date: string;
  adOverrides: AdOverride[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ArticleListProps {
  articles: Article[];
  pagination: PaginationInfo;
  onEdit: (slug: string) => void;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export default function ArticleList({
  articles,
  pagination,
  onEdit,
  onPageChange,
  isLoading = false,
  error = null,
}: ArticleListProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-sm text-muted-foreground">Failed to load articles</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-muted/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No articles found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Article List */}
      <div className="space-y-3">
        {articles.map((article) => (
          <ArticleListItem
            key={article._id}
            article={article}
            onEdit={onEdit}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total articles)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
