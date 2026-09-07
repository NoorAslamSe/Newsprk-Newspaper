"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";

interface CommentFormProps {
  articleSlug: string;
  onCommentAdded: () => void;
  t: (key: string) => string;
}

export function CommentForm({ articleSlug, onCommentAdded, t }: CommentFormProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !content.trim()) {
      setError(t("fillAllFields"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleSlug,
          authorName: name.trim(),
          content: content.trim(),
          rating,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || t("error"));
        return;
      }

      setName("");
      setContent("");
      setRating(5);
      onCommentAdded();
    } catch {
      setError(t("error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-[var(--flex-gray-7)] rounded-[var(--round-7)]">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-[13px] font-bold text-[var(--heading-color)]">
            {t("name")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("namePlaceholder")}
            maxLength={50}
            required
            className="w-full px-3 py-2.5 rounded-[var(--round-5)] bg-[var(--solid-white)] border border-[var(--flex-gray-15)] text-[var(--body-fcolor)] text-[14px] outline-none focus:border-[var(--g-color)] transition-colors"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-[13px] font-bold text-[var(--heading-color)]">
            {t("yourRating")}
          </label>
          <StarRating value={rating} onChange={setRating} size="lg" />
        </div>

        <div className="grid gap-2">
          <label className="text-[13px] font-bold text-[var(--heading-color)]">
            {t("comment")}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("commentPlaceholder")}
            maxLength={2000}
            rows={4}
            required
            className="w-full px-3 py-2.5 rounded-[var(--round-5)] bg-[var(--solid-white)] border border-[var(--flex-gray-15)] text-[var(--body-fcolor)] text-[14px] outline-none focus:border-[var(--g-color)] transition-colors resize-y min-h-[100px]"
          />
          <span className="text-[12px] text-[var(--meta-fcolor)] text-right">
            {content.length}/2000
          </span>
        </div>

        {error && (
          <p className="text-[13px] text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !name.trim() || !content.trim()}
          className="self-start px-6 py-2.5 rounded-[var(--round-5)] bg-[var(--g-color)] text-white text-[13px] font-bold border-0 cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "..." : t("submit")}
        </button>
      </div>
    </form>
  );
}
