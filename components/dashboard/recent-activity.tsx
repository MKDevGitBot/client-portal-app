import { formatDate, truncate } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
  sender: { name: string };
  project: { title: string };
}

export function RecentActivity({ messages }: { messages: Message[] }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900">
          Letzte Aktivitäten
        </h2>
        <a
          href="/messages"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Alle anzeigen →
        </a>
      </div>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-surface-400">
            Keine Aktivitäten
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex gap-3 rounded-lg border border-surface-100 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                {msg.sender.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-surface-900">
                    {msg.sender.name}
                  </span>
                  <span className="text-xs text-surface-400">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-surface-600">
                  {truncate(msg.content, 100)}
                </p>
                <span className="mt-1 inline-block text-xs text-surface-400">
                  in {msg.project.title}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
