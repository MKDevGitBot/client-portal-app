"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { Monitor, Trash2, LogOut } from "lucide-react";

interface Session {
  id: string;
  createdAt: string;
  expiresAt: string;
}

export function SessionsClient({
  sessions,
  currentSessionId,
}: {
  sessions: Session[];
  currentSessionId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const revokeSession = async (sessionId: string) => {
    try {
      const res = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) {
        showToast("Fehler beim Löschen", "error");
        return;
      }
      showToast("Sitzung beendet", "success");
      router.refresh();
    } catch {
      showToast("Verbindungsfehler", "error");
    }
  };

  const logoutAll = async () => {
    try {
      const res = await fetch("/api/auth/logout-all", { method: "POST" });
      if (!res.ok) {
        showToast("Fehler", "error");
        return;
      }
      showToast("Alle anderen Sitzungen beendet", "success");
      router.refresh();
    } catch {
      showToast("Verbindungsfehler", "error");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Sitzungsverwaltung
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            {sessions.length} aktive Sitzung{sessions.length !== 1 ? "en" : ""}
          </p>
        </div>
        {sessions.length > 1 && (
          <button onClick={logoutAll} className="btn-danger">
            <LogOut className="h-4 w-4" />
            Alle anderen beenden
          </button>
        )}
      </div>

      <div className="space-y-3">
        {sessions.map((session) => {
          const isCurrent = session.id === currentSessionId;
          const isExpired = new Date(session.expiresAt) < new Date();

          return (
            <div
              key={session.id}
              className={`card flex items-center gap-4 ${
                isCurrent
                  ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950"
                  : ""
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                <Monitor className="h-5 w-5 text-surface-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                    Sitzung #{session.id.slice(0, 8)}
                  </span>
                  {isCurrent && (
                    <span className="badge bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                      Aktuell
                    </span>
                  )}
                  {isExpired && (
                    <span className="badge bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300">
                      Abgelaufen
                    </span>
                  )}
                </div>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  Erstellt: {formatDate(session.createdAt)} · Läuft ab:{" "}
                  {formatDate(session.expiresAt)}
                </p>
              </div>
              {!isCurrent && (
                <button
                  onClick={() => revokeSession(session.id)}
                  className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  title="Sitzung beenden"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
