import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { cn, getStatusColor, getProgressForStatus, formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function ProjectDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      tasks: { orderBy: { createdAt: "asc" } },
      milestones: { orderBy: { dueDate: "asc" } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { sender: true },
      },
      invoices: { orderBy: { createdAt: "desc" } },
      files: { orderBy: { createdAt: "desc" }, take: 10 },
      intakes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) notFound();

  // Check access
  if (user.role !== "ADMIN" && project.ownerId !== user.id) {
    redirect("/dashboard");
  }

  const progress = getProgressForStatus(project.status);
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;

  const phases = [
    "PLANNING",
    "DESIGN",
    "DEVELOPMENT",
    "REVIEW",
    "LAUNCH",
    "COMPLETED",
  ];
  const currentPhaseIndex = phases.indexOf(project.status);

  return (
    <div>
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Projekten
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-900">
            {project.title}
          </h1>
          <span className={cn("badge", getStatusColor(project.status))}>
            {project.status}
          </span>
        </div>
        {project.description && (
          <p className="mt-2 text-surface-500">{project.description}</p>
        )}
      </div>

      {/* Phase Progress */}
      <div className="card mb-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-700">
          Projektphasen
        </h3>
        <div className="flex items-center gap-2">
          {phases.map((phase, i) => (
            <div key={phase} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                  i <= currentPhaseIndex
                    ? "bg-primary-600 text-white"
                    : "bg-surface-100 text-surface-400"
                )}
              >
                {i < currentPhaseIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < phases.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-8",
                    i < currentPhaseIndex ? "bg-primary-600" : "bg-surface-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs text-surface-500">
          {phases.map((phase) => (
            <span key={phase} className="text-center" style={{ width: "16%" }}>
              {phase}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">{progress}%</p>
          <p className="text-xs text-surface-500">Fortschritt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">
            {doneTasks}/{project.tasks.length}
          </p>
          <p className="text-xs text-surface-500">Aufgaben</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">
            {project.milestones.filter((m) => m.completed).length}/
            {project.milestones.length}
          </p>
          <p className="text-xs text-surface-500">Meilensteine</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">
            {formatCurrency(
              project.invoices.reduce((sum, i) => sum + i.amount, 0)
            )}
          </p>
          <p className="text-xs text-surface-500">Gesamtwert</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            Aufgaben
          </h3>
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-surface-100 p-3"
              >
                {task.status === "DONE" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : task.status === "IN_PROGRESS" ? (
                  <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-surface-300 shrink-0" />
                )}
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      task.status === "DONE"
                        ? "text-surface-400 line-through"
                        : "text-surface-900"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p className="text-xs text-surface-400">
                      Fällig: {formatDate(task.dueDate)}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "badge text-xs",
                    getStatusColor(task.priority)
                  )}
                >
                  {task.priority}
                </span>
              </div>
            ))}
            {project.tasks.length === 0 && (
              <p className="py-4 text-center text-sm text-surface-400">
                Keine Aufgaben
              </p>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            Nachrichten
          </h3>
          <div className="space-y-3">
            {project.messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                  {msg.sender.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-surface-900">
                      {msg.sender.name}
                    </span>
                    <span className="text-xs text-surface-400">
                      {formatDate(msg.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-surface-600">
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {project.messages.length === 0 && (
              <p className="py-4 text-center text-sm text-surface-400">
                Keine Nachrichten
              </p>
            )}
          </div>
        </div>

        {/* Milestones */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            Meilensteine
          </h3>
          <div className="space-y-3">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3">
                {milestone.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-surface-300 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-surface-900">
                    {milestone.title}
                  </p>
                  {milestone.dueDate && (
                    <p className="text-xs text-surface-400">
                      {formatDate(milestone.dueDate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {project.milestones.length === 0 && (
              <p className="py-4 text-center text-sm text-surface-400">
                Keine Meilensteine
              </p>
            )}
          </div>
        </div>

        {/* Invoices */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            Rechnungen
          </h3>
          <div className="space-y-3">
            {project.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between rounded-lg border border-surface-100 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-surface-900">
                    {invoice.number} — {invoice.title}
                  </p>
                  <p className="text-xs text-surface-400">
                    {invoice.dueDate
                      ? `Fällig: ${formatDate(invoice.dueDate)}`
                      : formatDate(invoice.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-surface-900">
                    {formatCurrency(invoice.amount)}
                  </p>
                  <span
                    className={cn("badge text-xs", getStatusColor(invoice.status))}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
            {project.invoices.length === 0 && (
              <p className="py-4 text-center text-sm text-surface-400">
                Keine Rechnungen
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
