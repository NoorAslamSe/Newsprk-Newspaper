"use client";

import { useTranslations } from "@/hooks/useTranslations";

interface AuthorCredentialsProps {
  authorName: string;
  reviewer?: string;
  role?: string;
  bio?: string;
  avatar?: string;
}

export default function AuthorCredentials({ authorName, reviewer, role, bio, avatar }: AuthorCredentialsProps) {
  const tArticle = useTranslations("article");
  const tComparison = useTranslations("comparison");
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
      <div className="flex items-start gap-4">
        {avatar ? (
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-zinc-700">
            <img src={avatar} alt={authorName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800 text-lg font-bold text-zinc-400">
            {authorName?.charAt(0) || "A"}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-white">{authorName}</h4>
            <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-zinc-400">{role || tArticle("seniorEditor")}</p>
          {reviewer && reviewer !== authorName && (
            <p className="mt-1 text-xs text-zinc-500">
              {tArticle("reviewedBy")} <span className="font-medium text-zinc-400">{reviewer}</span>
            </p>
          )}
          {bio && <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{bio}</p>}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-zinc-800/50 px-4 py-3 text-xs text-zinc-500">
        {tComparison("aiDisclosure").replace("{reviewer}", reviewer || authorName)}.
      </div>
    </div>
  );
}
