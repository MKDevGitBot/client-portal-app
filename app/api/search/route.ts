import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const isAdmin = user.role === "ADMIN";
  const results: {
    id: string;
    title: string;
    subtitle: string;
    type: string;
    href: string;
  }[] = [];

  // Search projects
  const projects = await prisma.project.findMany({
    where: {
      AND: [
        isAdmin ? {} : { ownerId: user.id },
        {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
      ],
    },
    include: { owner: { select: { name: true } } },
    take: 5,
  });
  projects.forEach((p) =>
    results.push({
      id: p.id,
      title: p.title,
      subtitle: `von ${p.owner.name} — ${p.status}`,
      type: "project",
      href: `/projects/${p.id}`,
    })
  );

  // Search invoices
  const invoices = await prisma.invoice.findMany({
    where: {
      AND: [
        isAdmin ? {} : { clientId: user.id },
        {
          OR: [
            { number: { contains: q } },
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        },
      ],
    },
    take: 5,
  });
  invoices.forEach((i) =>
    results.push({
      id: i.id,
      title: `${i.number} — ${i.title}`,
      subtitle: i.status,
      type: "invoice",
      href: `/invoices/${i.id}`,
    })
  );

  // Search messages
  const messages = await prisma.message.findMany({
    where: {
      AND: [
        isAdmin ? {} : { senderId: user.id },
        { content: { contains: q } },
      ],
    },
    include: {
      sender: { select: { name: true } },
      project: { select: { title: true } },
    },
    take: 5,
  });
  messages.forEach((m) =>
    results.push({
      id: m.id,
      title: m.content.slice(0, 80),
      subtitle: `${m.sender.name} in ${m.project.title}`,
      type: "message",
      href: `/messages`,
    })
  );

  return NextResponse.json({ results });
}
