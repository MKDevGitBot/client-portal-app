"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, getStatusColor, getProgressForStatus } from "@/lib/utils";
import { Plus, Archive } from "lucide-react";

interface ProjectItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  archived: boolean;
  owner: { name: string };
  tasks: { status: string }[];
  _count: { tasks: number; messages: number; invoices: number };
}

export default function ProjectsPageClient({
  initialProjects,
  isAdmin,
}: {
  initialProjects: ProjectItem[];
  isAdmin: boolean;
}) {
  const [showArchived, setShowArchived] = useState(false);

  const projects = initialProjects.filter((p) =>
    showArchived ? p.archived : !p.archived
  );

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Projekte
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            {projects.length}{" "}
            {showArchived ? "archivierte " : ""}Projekte
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "btn-secondary",
                showArchived && "bg-surface-200 dark:bg-surface-700"
              )}
            >
              <Archive className="h-4 w-4" />
              {showArchived ? "Aktive anzeigen" : "Archivierte"}
            </button>
          )}
          {isAdmin && (
            <Link href="/projects/new" className="btn-primary">
              <Plus className="h-4 w-4" />
              Neues Projekt
            </Link>
          )}
        </div>
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
              className={cn(
                "card transition-shadow hover:shadow-md",
                project.archived && "opacity-60"
              )}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("badge", getStatusColor(project.status))}
                  >
                    {project.status}
                  </span>
                  {project.archived && (
                    <span className="badge bg-gray-200 text-gray-600 text-xs dark:bg-gray-700 dark:text-gray-400">
                      Archiviert
                    </span>
                  )}
                </div>
                <span className="text-xs text-surface-400">
                  {project.owner.name}
                </span>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-surface-900 dark:text-surface-100">
                {project.title}
              </h3>

              {project.description && (
                <p className="mb-4 text-sm text-surface-500 line-clamp-2 dark:text-surface-400">
                  {project.description}
                </p>
              )}

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-1 flex justify-between text-xs text-surface-500 dark:text-surface-400">
                  <span>
                    {doneTasks}/{project._count.tasks} Aufgaben
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
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
          <p className="text-surface-400">
            {showArchived
              ? "Keine archivierten Projekte vorhanden."
              : "Noch keine Projekte vorhanden."}
          </p>
          {isAdmin && !showArchived && (
            <Link href="/projects/new" className="btn-primary mt-4">
              Erstes Projekt erstellen
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
