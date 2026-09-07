"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import type { Comment } from "@/types";

interface CommentCardProps {
  comment: Comment;
  onReply?: (parentId: string) => void;
  onDelete?: (id: string) => void;
  t: (key: string) => string;
}

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return t("justNow");
  if (diff < 3600) return t("minutesAgo").replace("{n}", String(Math.floor(diff / 60)));
  if (diff < 86400) return t("hoursAgo").replace("{n}", String(Math.floor(diff / 3600)));
  if (diff < 2592000) return t("daysAgo").replace("{n}", String(Math.floor(diff / 86400)));
  return new Date(dateStr).toLocaleDateString();
}

export function CommentCard({ comment, onReply, onDelete, t }: CommentCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyName, setReplyName] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyRating, setReplyRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const initial = comment.authorName.charAt(0).toUpperCase();

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyName.trim() || !replyContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleSlug: comment.articleSlug,
          authorName: replyName.trim(),
          content: replyContent.trim(),
          rating: replyRating,
          parentCommentId: comment.id,
        }),
      });

      if (res.ok) {
        setReplyName("");
        setReplyContent("");
        setReplyRating(5);
        setShowReplyForm(false);
        onReply?.(comment.id);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--g-color)] text-white flex items-center justify-center text-sm font-bold">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="font-bold text-[15px] text-[var(--heading-color)]">
            {comment.authorName}
          </span>
          {comment.rating > 0 && (
            <StarRating value={comment.rating} readonly size="sm" />
          )}
          <span className="text-[12px] text-[var(--meta-fcolor)]">
            {timeAgo(comment.createdAt, t)}
          </span>
        </div>

        <p className="text-[15px] leading-relaxed text-[var(--body-fcolor)] mb-3">
          {comment.content}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="text-[13px] font-bold text-[var(--meta-fcolor)] hover:text-[var(--g-color)] transition-colors bg-transparent border-0 cursor-pointer p-0"
          >
            <i className="ruby-icon-reply mr-1"></i>
            {t("reply")}
          </button>
        </div>

        {showReplyForm && (
          <form onSubmit={handleReply} className="mt-4 p-4 bg-[var(--flex-gray-7)] rounded-[var(--round-7)]">
            <div className="grid gap-3">
              <input
                type="text"
                placeholder={t("name")}
                value={replyName}
                onChange={(e) => setReplyName(e.target.value)}
                maxLength={50}
                required
                className="w-full px-3 py-2 rounded-[var(--round-5)] bg-[var(--solid-white)] border border-[var(--flex-gray-15)] text-[var(--body-fcolor)] text-[14px] outline-none focus:border-[var(--g-color)] transition-colors"
              />
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[var(--meta-fcolor)]">{t("rating")}:</span>
                <StarRating value={replyRating} onChange={setReplyRating} size="sm" />
              </div>
              <textarea
                placeholder={t("leaveComment")}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={2000}
                rows={3}
                required
                className="w-full px-3 py-2 rounded-[var(--round-5)] bg-[var(--solid-white)] border border-[var(--flex-gray-15)] text-[var(--body-fcolor)] text-[14px] outline-none focus:border-[var(--g-color)] transition-colors resize-y min-h-[80px]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting || !replyName.trim() || !replyContent.trim()}
                  className="px-4 py-2 rounded-[var(--round-5)] bg-[var(--g-color)] text-white text-[13px] font-bold border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "..." : t("reply")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-4 py-2 rounded-[var(--round-5)] bg-transparent text-[var(--meta-fcolor)] text-[13px] font-bold border border-[var(--flex-gray-15)] cursor-pointer hover:bg-[var(--flex-gray-7)] transition-colors"
                >
                  {t("cancel")}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
