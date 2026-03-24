import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cn, getStatusColor, getProgressForStatus } from "@/lib/utils";
import { Plus } from "lucide-react";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const where = isAdmin ? {} : { ownerId: user.id };

  const projects = await prisma.project.findMany({
    where,
    include: {
      owner: true,
      tasks: true,
      _count: { select: { tasks: true, messages: true, invoices: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Projekte</h1>
          <p className="mt-1 text-surface-500">
            {projects.length} Projekte insgesamt
          </p>
        </div>
        {isAdmin && (
          <Link href="/projects/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Neues Projekt
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = getProgressForStatus(project.status);
          const doneTasks = project.tasks.filter(
            (t) => t.status === "DONE"
          ).length;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="card transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={cn("badge", getStatusColor(project.status))}
                >
                  {project.status}
                </span>
                <span className="text-xs text-surface-400">
                  {project.owner.name}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-surface-900">
                {project.title}
              </h3>

              {project.description && (
                <p className="mb-4 text-sm text-surface-500 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs text-surface-500">
                  <span>
                    {doneTasks}/{project._count.tasks} Aufgaben
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex gap-4 text-xs text-surface-400">
                <span>{project._count.messages} Nachrichten</span>
                <span>{project._count.invoices} Rechnungen</span>
              </div>
            </Link>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="card py-16 text-center">
          <p className="text-surface-400">Noch keine Projekte vorhanden.</p>
          {isAdmin && (
            <Link href="/projects/new" className="btn-primary mt-4">
              Erstes Projekt erstellen
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
