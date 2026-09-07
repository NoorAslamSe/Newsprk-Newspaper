"use client";

import { PostEditor } from "@/components/admin/post-editor";

export default function NewPostPage() {
  return (
    <div className="px-4 py-4 lg:px-6 lg:py-6">
      <PostEditor mode="create" />
    </div>
  );
}

