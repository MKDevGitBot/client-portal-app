import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Clock, User, FileText, FolderKanban, MessageSquare, Shield } from "lucide-react";

const entityIcons: Record<string, React.ElementType> = {
  Project: FolderKanban,
  Invoice: FileText,
  Message: MessageSquare,
  User: User,
  Session: Shield,
};

const actionLabels: Record<string, string> = {
  CREATE: "Erstellt",
  UPDATE: "Aktualisiert",
  DELETE: "Gelöscht",
  LOGIN: "Angemeldet",
  LOGOUT: "Abgemeldet",
};

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  UPDATE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  LOGIN: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  LOGOUT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default async function ActivityPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const logs = await prisma.activityLog.findMany({
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Aktivitätsprotokoll
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Letzte {logs.length} Aktivitäten
        </p>
      </div>

      <div className="card">
        {logs.length === 0 ? (
          <p className="py-8 text-center text-surface-400">
            Keine Aktivitäten vorhanden
          </p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => {
              const Icon = entityIcons[log.entity] || Clock;
              return (
                <div
                  key={log.id}
                  className="flex items-center gap-4 rounded-lg border border-surface-100 p-3 dark:border-surface-800"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800">
                    <Icon className="h-4 w-4 text-surface-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                        {log.user.name}
                      </span>
                      <span
                        className={`badge text-xs ${actionColors[log.action] || actionColors.UPDATE}`}
                      >
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="text-xs text-surface-500 dark:text-surface-400">
                        {log.entity}
                        {log.entityId && ` #${log.entityId.slice(0, 8)}`}
                      </span>
                    </div>
                    {log.details && (
                      <p className="mt-0.5 text-xs text-surface-400">
                        {log.details}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-surface-400">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
