"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "@/hooks/useTranslations";
import { CommentCard } from "./CommentCard";
import { CommentForm } from "./CommentForm";
import { StarRating } from "./StarRating";
import type { Comment } from "@/types";

interface CommentSectionProps {
  articleSlug: string;
}

export function CommentSection({ articleSlug }: CommentSectionProps) {
  const t = useTranslations("article");
  const [comments, setComments] = useState<Comment[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?articleSlug=${encodeURIComponent(articleSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setAverageRating(data.averageRating || 0);
        setTotalComments(data.totalComments || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [articleSlug]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleCommentAdded = () => {
    fetchComments();
  };

  const parentComments = comments.filter((c) => !c.parentCommentId);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentCommentId === parentId);

  return (
    <section className="mt-10 pt-8 border-t border-dotted border-[var(--flex-gray-15)] border-t-[var(--flex-gray-15)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2
          className="text-[var(--heading-color)]"
          style={{ fontSize: "var(--h2-fsize)", fontWeight: 700 }}
        >
          {t("leaveComment")}
          {totalComments > 0 && (
            <span className="ml-2 text-[16px] font-normal text-[var(--meta-fcolor)]">
              ({totalComments})
            </span>
          )}
        </h2>

        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(averageRating)} readonly size="md" />
            <span className="text-[14px] font-bold text-[var(--heading-color)]">
              {averageRating}
            </span>
            <span className="text-[13px] text-[var(--meta-fcolor)]">
              ({totalComments} {totalComments === 1 ? t("review") : t("reviews")})
            </span>
          </div>
        )}
      </div>

      {/* Form */}
      <div className="mb-8">
        <CommentForm
          articleSlug={articleSlug}
          onCommentAdded={handleCommentAdded}
          t={t}
        />
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-[var(--flex-gray-15)]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[var(--flex-gray-15)] rounded" />
                <div className="h-3 w-full bg-[var(--flex-gray-15)] rounded" />
                <div className="h-3 w-3/4 bg-[var(--flex-gray-15)] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : parentComments.length === 0 ? (
        <div className="text-center py-10 text-[var(--meta-fcolor)] text-[14px]">
          {t("noComments")}
        </div>
      ) : (
        <div className="space-y-6">
          {parentComments.map((comment) => (
            <div key={comment.id}>
              <CommentCard
                comment={comment}
                onReply={handleCommentAdded}
                t={t}
              />
              {/* Replies */}
              {getReplies(comment.id).length > 0 && (
                <div className="ml-14 mt-4 space-y-5 border-l-2 border-[var(--flex-gray-15)] pl-5">
                  {getReplies(comment.id).map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      onReply={handleCommentAdded}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
