import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate, truncate } from "@/lib/utils";
import Link from "next/link";
import { MessageComposer } from "@/components/messages/message-composer";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const where = isAdmin ? {} : { project: { ownerId: user.id } };

  const messages = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { name: true, role: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const projects = await prisma.project.findMany({
    where: isAdmin ? {} : { ownerId: user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  // Group by project
  const byProject = new Map<
    string,
    { project: { id: string; title: string }; messages: typeof messages }
  >();

  for (const msg of messages) {
    const key = msg.project.id;
    if (!byProject.has(key)) {
      byProject.set(key, { project: msg.project, messages: [] });
    }
    byProject.get(key)!.messages.push(msg);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Nachrichten</h1>
        <p className="mt-1 text-surface-500">
          Kommunikation zu deinen Projekten
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Message List */}
        <div className="lg:col-span-2">
          {byProject.size === 0 ? (
            <div className="card py-16 text-center">
              <p className="text-surface-400">Noch keine Nachrichten</p>
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
                    <span className="text-xs text-surface-400">
                      {msgs.length} Nachrichten
                    </span>
                  </div>

                  <div className="space-y-4">
                    {msgs.slice(0, 5).map((msg) => (
                      <div key={msg.id} className="flex gap-3">
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
                          <div className="flex items-center gap-2">
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
                              {msg.sender.role === "ADMIN"
                                ? "Freelancer"
                                : "Kunde"}
                            </span>
                            <span className="text-xs text-surface-400">
                              {formatDate(msg.createdAt)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-surface-600">
                            {msg.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compose */}
        <div>
          <MessageComposer projects={projects} />
        </div>
      </div>
    </div>
  );
}
