import Link from "next/link";
import { cn, getStatusColor, getProgressForStatus } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  status: string;
  owner: { name: string };
  tasks: { id: string; status: string }[];
  updatedAt: Date;
}

export function RecentProjects({ projects }: { projects: Project[] }) {
  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-900">
          Aktuelle Projekte
        </h2>
        <Link
          href="/projects"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Alle anzeigen →
        </Link>
      </div>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <p className="py-8 text-center text-surface-400">
            Keine Projekte vorhanden
          </p>
        ) : (
          projects.map((project) => {
            const progress = getProgressForStatus(project.status);
            const doneTasks = project.tasks.filter(
              (t) => t.status === "DONE"
            ).length;
            const totalTasks = project.tasks.length;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-lg border border-surface-100 p-4 transition-colors hover:border-surface-200 hover:bg-surface-50"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-surface-900">
                    {project.title}
                  </h3>
                  <span
                    className={cn(
                      "badge",
                      getStatusColor(project.status)
                    )}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-surface-500">
                    <span>
                      {doneTasks}/{totalTasks} Aufgaben
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
