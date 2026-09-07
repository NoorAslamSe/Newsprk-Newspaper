"use client";

import * as React from "react";
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/dateFormat";

interface AdOverride {
  position: string;
  adSnippetId: string;
  width?: number;
  height?: number;
}

interface ArticleListItemProps {
  article: {
    _id: string;
    slug: string;
    title: string;
    date: string;
    locale?: string;
    adOverrides: AdOverride[];
  };
  onEdit: (slug: string) => void;
}

export default function ArticleListItem({ article, onEdit }: ArticleListItemProps) {
  const overrideCount = article.adOverrides?.length || 0;
  const hasOverrides = overrideCount > 0;

  const formattedDate = formatDate(article.date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-base truncate">{article.title}</h3>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="truncate">{article.slug}</span>
              <span>•</span>
              <span>{formattedDate}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {article.locale && (
                <Badge variant="secondary" className="uppercase text-[10px]">
                  {article.locale}
                </Badge>
              )}
              {hasOverrides ? (
                <Badge variant="default">
                  {overrideCount} {overrideCount === 1 ? "override" : "overrides"}
                </Badge>
              ) : (
                <Badge variant="outline">Site-wide defaults</Badge>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(article.slug)}
            className="shrink-0"
          >
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
