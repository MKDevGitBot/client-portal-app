"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDate } from "@/lib/utils";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { name: string };
}

export default function FileComments({
  fileId,
  userId,
}: {
  fileId: string;
  userId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/files/${fileId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {
      // Failed to fetch comments
    }
  }, [fileId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/files/${fileId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        setContent("");
        fetchComments();
      }
    } catch {
      // Failed to post comment
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wide">
        Kommentare
      </h4>

      {comments.length === 0 ? (
        <p className="text-xs text-surface-400">Noch keine Kommentare</p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg bg-surface-50 p-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-surface-700">
                  {comment.user.name}
                </span>
                <span className="text-xs text-surface-400">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-xs text-surface-600">{comment.content}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Kommentar..."
          className="flex-1 rounded-lg border border-surface-200 px-2 py-1 text-xs focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="rounded-lg bg-primary-600 p-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
        >
          <Send className="h-3 w-3" />
        </button>
      </form>
    </div>
  );
}
