import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { cn, formatDate, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock } from "lucide-react";

interface Props {
  params: { id: string };
}

function getDayDiff(start: Date, end: Date): number {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default async function ProjectTimelinePage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      tasks: { orderBy: { createdAt: "asc" } },
      milestones: { orderBy: { dueDate: "asc" } },
    },
  });

  if (!project) notFound();

  // Check access
  if (user.role !== "ADMIN" && project.ownerId !== user.id) {
    redirect("/dashboard");
  }

  // Calculate timeline range
  const startDate = project.startDate;
  const endDate = project.dueDate || addDays(startDate, 90);
  const totalDays = Math.max(getDayDiff(startDate, endDate), 30);

  // Group tasks by status
  const tasksByStatus = {
    TODO: project.tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: project.tasks.filter((t) => t.status === "IN_PROGRESS"),
    REVIEW: project.tasks.filter((t) => t.status === "REVIEW"),
    DONE: project.tasks.filter((t) => t.status === "DONE"),
  };

  const statusLabels: Record<string, string> = {
    TODO: "Offen",
    IN_PROGRESS: "In Bearbeitung",
    REVIEW: "Review",
    DONE: "Fertig",
  };

  const statusColors: Record<string, string> = {
    TODO: "bg-surface-200",
    IN_PROGRESS: "bg-blue-400",
    REVIEW: "bg-amber-400",
    DONE: "bg-green-400",
  };

  // Phase markers
  const phases = ["PLANNING", "DESIGN", "DEVELOPMENT", "REVIEW", "LAUNCH", "COMPLETED"];
  const phaseLabels: Record<string, string> = {
    PLANNING: "Planung",
    DESIGN: "Design",
    DEVELOPMENT: "Entwicklung",
    REVIEW: "Review",
    LAUNCH: "Launch",
    COMPLETED: "Fertig",
  };

  // Generate weeks for the header
  const weeks = [];
  const currentWeek = new Date(startDate);
  while (getDayDiff(startDate, new Date(currentWeek)) < totalDays) {
    weeks.push(new Date(currentWeek));
    currentWeek.setDate(currentWeek.getDate() + 7);
  }

  return (
    <div>
      <Link
        href={`/projects/${project.id}`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Projekt
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-surface-900">
            Timeline: {project.title}
          </h1>
          <span className={cn("badge", getStatusColor(project.status))}>
            {project.status}
          </span>
        </div>
        <p className="mt-1 text-surface-500">
          {formatDate(startDate)} – {endDate ? formatDate(endDate) : "Offen"} · {totalDays} Tage
        </p>
      </div>

      {/* Phase Markers */}
      <div className="card mb-6">
        <h3 className="mb-4 text-sm font-semibold text-surface-700">Projektphasen</h3>
        <div className="relative">
          <div className="h-2 rounded-full bg-surface-100">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{
                width: `${Math.min(
                  ((phases.indexOf(project.status) + 1) / phases.length) * 100,
                  100
                )}%`,
              }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            {phases.map((phase, i) => {
              const currentIndex = phases.indexOf(project.status);
              const isComplete = i < currentIndex;
              const isCurrent = i === currentIndex;

              return (
                <div
                  key={phase}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / phases.length}%` }}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                      isComplete
                        ? "bg-primary-600 text-white"
                        : isCurrent
                        ? "bg-primary-100 text-primary-700 ring-2 ring-primary-500"
                        : "bg-surface-100 text-surface-400"
                    )}
                  >
                    {isComplete ? "✓" : i + 1}
                  </div>
                  <span className="mt-1 text-xs text-surface-500">
                    {phaseLabels[phase]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Gantt-like Timeline */}
      <div className="card overflow-x-auto">
        <h3 className="mb-4 text-lg font-semibold text-surface-900">Aufgaben Timeline</h3>

        {/* Timeline Header */}
        <div className="mb-4 flex border-b border-surface-200 pb-2">
          <div className="w-64 shrink-0 text-xs font-medium text-surface-500">Aufgabe</div>
          <div className="flex flex-1">
            {weeks.map((week, i) => (
              <div
                key={i}
                className="flex-1 text-center text-xs text-surface-400"
                style={{ minWidth: "60px" }}
              >
                {formatDate(week)}
              </div>
            ))}
          </div>
        </div>

        {/* Task Rows */}
        {Object.entries(tasksByStatus).map(([status, tasks]) =>
          tasks.length === 0 ? null : (
            <div key={status} className="mb-4">
              <div className="mb-2 flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
                <span className="text-xs font-medium text-surface-500">
                  {statusLabels[status]} ({tasks.length})
                </span>
              </div>

              {tasks.map((task) => {
                // Calculate bar position and width
                const taskStart = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
                const daysFromStart = getDayDiff(startDate, taskStart);
                const barWidth = task.status === "DONE" ? 7 : 14; // days
                const barLeft = Math.max(0, (daysFromStart / totalDays) * 100);
                const barWidthPercent = (barWidth / totalDays) * 100;

                const barColor =
                  task.status === "DONE"
                    ? "bg-green-400"
                    : task.status === "IN_PROGRESS"
                    ? "bg-blue-400"
                    : task.status === "REVIEW"
                    ? "bg-amber-400"
                    : "bg-surface-300";

                return (
                  <div key={task.id} className="flex items-center py-1.5 hover:bg-surface-50">
                    <div className="w-64 shrink-0 pr-4">
                      <div className="flex items-center gap-2">
                        {task.status === "DONE" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : task.status === "IN_PROGRESS" ? (
                          <Clock className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-surface-300 shrink-0" />
                        )}
                        <span
                          className={cn(
                            "text-sm truncate",
                            task.status === "DONE"
                              ? "text-surface-400 line-through"
                              : "text-surface-900"
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                    </div>
                    <div className="relative flex-1" style={{ height: "24px" }}>
                      <div
                        className={cn(
                          "absolute top-1 h-6 rounded-md transition-all",
                          barColor,
                          task.status === "DONE" && "opacity-60"
                        )}
                        style={{
                          left: `${barLeft}%`,
                          width: `${Math.max(barWidthPercent, 1)}%`,
                        }}
                        title={`${task.title} – ${
                          task.dueDate ? formatDate(task.dueDate) : "Kein Datum"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {project.tasks.length === 0 && (
          <div className="py-16 text-center">
            <Calendar className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-surface-400">Keine Aufgaben vorhanden</p>
          </div>
        )}

        {/* Milestones */}
        {project.milestones.length > 0 && (
          <div className="mt-6 border-t border-surface-200 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-surface-700">Meilensteine</h4>
            <div className="space-y-2">
              {project.milestones.map((ms) => {
                if (!ms.dueDate) return null;
                const daysFromStart = getDayDiff(startDate, new Date(ms.dueDate));
                const leftPercent = Math.min(
                  Math.max((daysFromStart / totalDays) * 100, 0),
                  100
                );

                return (
                  <div key={ms.id} className="flex items-center py-1">
                    <div className="w-64 shrink-0 pr-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary-500 shrink-0" />
                        <span className="text-sm font-medium text-surface-700">
                          {ms.title}
                        </span>
                        {ms.completed && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="relative flex-1" style={{ height: "24px" }}>
                      <div
                        className={cn(
                          "absolute top-1 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border-2",
                          ms.completed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-primary-500 bg-white text-primary-500"
                        )}
                        style={{ left: `${leftPercent}%` }}
                        title={`${ms.title} – ${formatDate(ms.dueDate)}`}
                      >
                        <Calendar className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-surface-500">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-surface-300" /> Offen
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-blue-400" /> In Bearbeitung
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-amber-400" /> Review
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-400" /> Fertig
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full border-2 border-primary-500" /> Meilenstein
        </div>
      </div>
    </div>
  );
}
