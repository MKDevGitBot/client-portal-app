import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MessagesPageClient from "./messages-client";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const where = isAdmin ? {} : { project: { ownerId: user.id } };

  const rawMessages = await prisma.message.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, title: true } },
      reads: {
        where: { userId: user.id },
        select: { readAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const messages = rawMessages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    reads: m.reads.map((r) => ({ readAt: r.readAt.toISOString() })),
  }));

  const projects = await prisma.project.findMany({
    where: isAdmin ? {} : { ownerId: user.id },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <MessagesPageClient
      initialMessages={messages}
      projects={projects}
      userId={user.id}
    />
  );
}
