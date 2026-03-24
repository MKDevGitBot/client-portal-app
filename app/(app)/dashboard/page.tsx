import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  FolderKanban,
  FileText,
  MessageSquare,
  DollarSign,
  Users,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  // Fetch stats
  const where = isAdmin ? {} : { ownerId: user.id };

  const [projects, invoices, messages, tasks, clients] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { owner: true, tasks: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.invoice.findMany({
      where: isAdmin ? {} : { clientId: user.id },
    }),
    prisma.message.findMany({
      where: isAdmin ? {} : { senderId: user.id },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { sender: true, project: true },
    }),
    prisma.task.findMany({
      where: isAdmin ? {} : { project: { ownerId: user.id } },
    }),
    isAdmin
      ? prisma.user.findMany({ where: { role: "CLIENT" } })
      : Promise.resolve([]),
  ]);

  const activeProjects = projects.filter(
    (p) => p.status !== "COMPLETED"
  ).length;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "PAID").length;
  const openInvoices = invoices.filter(
    (i) => i.status === "SENT" || i.status === "OVERDUE"
  ).length;
  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0);
  const openRevenue = invoices
    .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
    .reduce((sum, i) => sum + (i.totalAmount || i.amount), 0);
  const openTasks = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  ).length;

  // Status distribution for simple CSS bar chart
  const statusCounts: Record<string, number> = {};
  projects.forEach((p) => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  const statusOrder = [
    "PLANNING",
    "DESIGN",
    "DEVELOPMENT",
    "REVIEW",
    "LAUNCH",
    "COMPLETED",
  ];
  const statusColors: Record<string, string> = {
    PLANNING: "bg-blue-500",
    DESIGN: "bg-purple-500",
    DEVELOPMENT: "bg-amber-500",
    REVIEW: "bg-orange-500",
    LAUNCH: "bg-green-500",
    COMPLETED: "bg-emerald-500",
  };
  const statusLabels: Record<string, string> = {
    PLANNING: "Planung",
    DESIGN: "Design",
    DEVELOPMENT: "Entwicklung",
    REVIEW: "Review",
    LAUNCH: "Launch",
    COMPLETED: "Abgeschlossen",
  };
  const totalProjects = projects.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Willkommen zurück, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Hier ist deine Übersicht für heute.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Aktive Projekte"
          value={activeProjects}
          icon={FolderKanban}
          color="blue"
        />
        <StatsCard
          title="Offene Rechnungen"
          value={openInvoices}
          subtitle={formatCurrency(openRevenue)}
          icon={DollarSign}
          color="amber"
        />
        {isAdmin && (
          <StatsCard
            title="Gesamtumsatz"
            value={formatCurrency(totalRevenue)}
            icon={TrendingUp}
            color="green"
          />
        )}
        {isAdmin ? (
          <StatsCard
            title="Kunden"
            value={clients.length}
            icon={Users}
            color="purple"
          />
        ) : (
          <StatsCard
            title="Offene Aufgaben"
            value={openTasks}
            icon={FileText}
            color="purple"
          />
        )}
      </div>

      {/* Project Status Distribution (CSS bars) */}
      {totalProjects > 0 && (
        <div className="mb-8 card">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Projektstatus-Übersicht
          </h2>
          <div className="space-y-3">
            {statusOrder.map((status) => {
              const count = statusCounts[status] || 0;
              const pct =
                totalProjects > 0
                  ? Math.round((count / totalProjects) * 100)
                  : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-surface-600 dark:text-surface-400">
                    {statusLabels[status]}
                  </span>
                  <div className="flex-1 h-3 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-800">
                    <div
                      className={`h-full rounded-full transition-all ${statusColors[status]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-xs text-surface-500 dark:text-surface-400">
                    {count} ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentProjects projects={projects} />
        <RecentActivity messages={messages} />
      </div>
    </div>
  );
}
