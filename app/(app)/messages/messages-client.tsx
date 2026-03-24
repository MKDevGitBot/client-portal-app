"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { MessageSquare, Paperclip, ExternalLink, Check, CheckCheck } from "lucide-react";
import Link from "next/link";

interface MessageRead {
  readAt: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  attachmentUrl: string | null;
  createdAt: string;
  sender: { id: string; name: string; role: string };
  project: { id: string; title: string };
  reads: MessageRead[];
}

interface Project {
  id: string;
  title: string;
}

interface SSEData {
  type: string;
  message?: Message;
}

export default function MessagesPageClient({
  initialMessages,
  projects,
  userId,
}: {
  initialMessages: Message[];
  projects: Project[];
  userId: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    const count = messages.filter((m) => m.reads.length === 0).length;
    setUnreadCount(count);
  }, [messages]);

  // SSE connection for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/messages/stream");

      eventSource.onmessage = (event) => {
        try {
          const data: SSEData = JSON.parse(event.data);
          if (data.type === "new_message" && data.message) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message!.id)) return prev;
              return [data.message!, ...prev];
            });
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        setTimeout(() => {
          router.refresh();
        }, 5000);
      };
    } catch {
      // SSE not supported
    }

    return () => {
      eventSource?.close();
    };
  }, [router]);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return;
    try {
      await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds }),
      });
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id) && m.reads.length === 0
            ? { ...m, reads: [{ readAt: new Date().toISOString() }] }
            : m
        )
      );
    } catch {
      // Failed to mark as read
    }
  }, []);

  // Auto-mark unread messages as read after delay
  useEffect(() => {
    const unreadIds = messages.filter((m) => m.reads.length === 0).map((m) => m.id);
    if (unreadIds.length > 0) {
      const timer = setTimeout(() => markAsRead(unreadIds), 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, markAsRead]);

  // Group messages by project
  const byProject = new Map<
    string,
    { project: { id: string; title: string }; messages: Message[] }
  >();
  for (const msg of messages) {
    const key = msg.project.id;
    if (!byProject.has(key)) {
      byProject.set(key, { project: msg.project, messages: [] });
    }
    byProject.get(key)!.messages.push(msg);
  }

  // Composer state
  const [composerProjectId, setComposerProjectId] = useState("");
  const [composerType, setComposerType] = useState("GENERAL");
  const [composerContent, setComposerContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!composerProjectId || !composerContent.trim()) return;
    setSending(true);
    setError("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: composerProjectId,
          content: composerContent,
          type: composerType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Senden");
        return;
      }
      setComposerContent("");
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-900">Nachrichten</h1>
          {unreadCount > 0 && (
            <span className="inline-flex h-6 items-center rounded-full bg-primary-600 px-2.5 text-xs font-medium text-white">
              {unreadCount} ungelesen
            </span>
          )}
        </div>
        <p className="mt-1 text-surface-500">Kommunikation zu deinen Projekten</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Message List */}
        <div className="lg:col-span-2">
          {byProject.size === 0 ? (
            <div className="card py-16 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-surface-300" />
              <p className="mt-4 text-surface-400">Noch keine Nachrichten</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(byProject.values()).map(({ project, messages: msgs }) => (
                <div key={project.id} className="card">
                  <div className="mb-4 flex items-center justify-between">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-semibold text-surface-900 hover:text-primary-600"
                    >
                      {project.title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-surface-400">
                        {msgs.length} Nachrichten
                      </span>
                      {msgs.some((m) => m.reads.length === 0) && (
                        <span className="inline-flex h-5 items-center rounded-full bg-primary-100 px-2 text-xs font-medium text-primary-700">
                          {msgs.filter((m) => m.reads.length === 0).length} neu
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {msgs.slice(0, 5).map((msg) => {
                      const isUnread = msg.reads.length === 0;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-3 rounded-lg p-2 -mx-2",
                            isUnread && "bg-primary-50/50"
                          )}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                              msg.sender.role === "ADMIN"
                                ? "bg-primary-100 text-primary-700"
                                : "bg-surface-200 text-surface-600"
                            }`}
                          >
                            {msg.sender.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-surface-900">
                                {msg.sender.name}
                              </span>
                              <span
                                className={`badge text-xs ${
                                  msg.sender.role === "ADMIN"
                                    ? "bg-primary-100 text-primary-700"
                                    : "bg-surface-100 text-surface-600"
                                }`}
                              >
                                {msg.sender.role === "ADMIN" ? "Freelancer" : "Kunde"}
                              </span>
                              <span className="text-xs text-surface-400">
                                {formatDate(msg.createdAt)}
                              </span>
                              {isUnread ? (
                                <Check className="h-3 w-3 text-surface-400" />
                              ) : (
                                <CheckCheck className="h-3 w-3 text-primary-500" />
                              )}
                            </div>
                            <p className="mt-1 text-sm text-surface-600">{msg.content}</p>
                            {msg.attachmentUrl && (
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-surface-200 px-2 py-1 text-xs text-surface-600 hover:bg-surface-50"
                              >
                                <Paperclip className="h-3 w-3" />
                                Anhang anzeigen
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compose */}
        <div>
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-surface-900">Neue Nachricht</h3>

            <form onSubmit={handleSend} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Projekt *
                </label>
                <select
                  value={composerProjectId}
                  onChange={(e) => setComposerProjectId(e.target.value)}
                  required
                  className="input"
                >
                  <option value="">Projekt wählen...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">Art</label>
                <select
                  value={composerType}
                  onChange={(e) => setComposerType(e.target.value)}
                  className="input"
                >
                  <option value="GENERAL">Allgemein</option>
                  <option value="UPDATE">Update</option>
                  <option value="FEEDBACK">Feedback</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-surface-700">
                  Nachricht *
                </label>
                <textarea
                  value={composerContent}
                  onChange={(e) => setComposerContent(e.target.value)}
                  required
                  rows={4}
                  className="input"
                  placeholder="Schreibe deine Nachricht..."
                />
              </div>

              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? "Wird gesendet..." : "Nachricht senden"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
