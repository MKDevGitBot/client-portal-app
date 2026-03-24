import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProjectsPageClient from "./projects-client";

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
    <ProjectsPageClient
      initialProjects={projects}
      isAdmin={isAdmin}
    />
  );
}
