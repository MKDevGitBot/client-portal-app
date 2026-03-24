import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { cn, getStatusColor, getProgressForStatus, formatDate, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Archive,
  ArchiveRestore,
  BarChart3,
} from "lucide-react";
import PhaseProgressBar from "@/components/projects/phase-progress";
import { AddTaskForm, ToggleTaskStatus } from "@/components/projects/task-actions";
import { AddMilestoneForm, ToggleMilestone, DeleteItem } from "@/components/projects/milestone-actions";

interface Props {
  params: { id: string };
}

const phases = ["PLANNING", "DESIGN", "DEVELOPMENT", "REVIEW", "LAUNCH", "COMPLETED"];

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

  const isAdmin = user.role === "ADMIN";
  const progress = getProgressForStatus(project.status);
  const doneTasks = project.tasks.filter((t) => t.status === "DONE").length;
  const currentPhaseIndex = phases.indexOf(project.status);

  // Calculate tasks per phase for progress bar
  const phaseTasks = phases.map((phase) => {
    // For a real app, you'd associate tasks with phases. Here we distribute evenly as a demo
    const phaseIndex = phases.indexOf(phase);
    const tasksForPhase = project.tasks.filter((t, i) => {
      // Simple distribution based on task index
      const taskPhase = Math.floor((i / Math.max(project.tasks.length, 1)) * phases.length);
      return taskPhase === phaseIndex;
    });
    return {
      name: phase,
      done: tasksForPhase.filter((t) => t.status === "DONE").length,
      total: tasksForPhase.length,
    };
  });

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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-surface-900">
              {project.title}
            </h1>
            <span className={cn("badge", getStatusColor(project.status))}>
              {project.status}
            </span>
            {project.archived && (
              <span className="badge bg-gray-200 text-gray-600">Archiviert</span>
            )}
          </div>
          {project.description && (
            <p className="mt-2 text-surface-500">{project.description}</p>
          )}
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Link
              href={`/projects/${project.id}/timeline`}
              className="btn-secondary"
            >
              <BarChart3 className="h-4 w-4" />
              Timeline
            </Link>
            <form action={`/api/projects/${project.id}/template`} method="POST">
              <button type="submit" className="btn-secondary">
                <Copy className="h-4 w-4" />
                Duplizieren
              </button>
            </form>
            <form action={`/api/projects/${project.id}/archive`} method="POST">
              <button type="submit" className="btn-secondary">
                {project.archived ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Reaktivieren
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Archivieren
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Phase Progress Bar */}
      <div className="card mb-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-700">
          Projektphasen & Fortschritt
        </h3>
        <PhaseProgressBar phases={phaseTasks} currentPhase={project.status} />
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
              project.invoices.reduce((sum, i) => sum + (i.totalAmount || i.amount), 0)
            )}
          </p>
          <p className="text-xs text-surface-500">Gesamtwert</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Tasks */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Aufgaben</h3>
            <div className="flex items-center gap-2">
              {isAdmin && <AddTaskForm projectId={project.id} />}
              <Link
                href={`/projects/${project.id}/timeline`}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Timeline →
              </Link>
            </div>
          </div>
          <div className="space-y-2">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-surface-100 p-3 dark:border-surface-700"
              >
                {isAdmin ? (
                  <ToggleTaskStatus taskId={task.id} currentStatus={task.status} />
                ) : (
                  task.status === "DONE" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : task.status === "IN_PROGRESS" ? (
                    <Clock className="h-5 w-5 text-amber-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-surface-300 shrink-0" />
                  )
                )}
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      task.status === "DONE"
                        ? "text-surface-400 line-through"
                        : "text-surface-900 dark:text-surface-100"
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
                {isAdmin && <DeleteItem type="task" id={task.id} />}
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
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-surface-900 dark:text-surface-100">Meilensteine</h3>
            {isAdmin && <AddMilestoneForm projectId={project.id} />}
          </div>
          <div className="space-y-3">
            {project.milestones.map((milestone) => (
              <div key={milestone.id} className="flex items-center gap-3">
                {isAdmin ? (
                  <ToggleMilestone milestoneId={milestone.id} completed={milestone.completed} />
                ) : (
                  milestone.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-surface-300 shrink-0" />
                  )
                )}
                <div className="flex-1">
                  <p className={cn("text-sm font-medium", milestone.completed ? "text-surface-400 line-through" : "text-surface-900 dark:text-surface-100")}>
                    {milestone.title}
                  </p>
                  {milestone.dueDate && (
                    <p className="text-xs text-surface-400">
                      {formatDate(milestone.dueDate)}
                    </p>
                  )}
                </div>
                {isAdmin && <DeleteItem type="milestone" id={milestone.id} />}
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
                    {formatCurrency(invoice.totalAmount || invoice.amount)}
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
