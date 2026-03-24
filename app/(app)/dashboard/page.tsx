import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AppLayout from "../layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { FolderKanban, FileText, MessageSquare, DollarSign } from "lucide-react";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  // Fetch stats
  const where = isAdmin ? {} : { ownerId: user.id };

  const [projects, invoices, messages, tasks] = await Promise.all([
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
  ]);

  const activeProjects = projects.filter(
    (p) => p.status !== "COMPLETED"
  ).length;
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "PAID").length;
  const totalRevenue = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);
  const openTasks = tasks.filter(
    (t) => t.status === "TODO" || t.status === "IN_PROGRESS"
  ).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">
          Willkommen zurück, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-surface-500">
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
          title="Offene Aufgaben"
          value={openTasks}
          icon={FileText}
          color="amber"
        />
        <StatsCard
          title="Rechnungen"
          value={`${paidInvoices}/${totalInvoices}`}
          subtitle="bezahlt"
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Nachrichten"
          value={messages.length}
          subtitle="diese Woche"
          icon={MessageSquare}
          color="purple"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentProjects projects={projects} />
        <RecentActivity messages={messages} />
      </div>
    </div>
  );
}
