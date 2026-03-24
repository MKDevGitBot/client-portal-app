import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur Admins" }, { status: 403 });
    }

    const { title, description, status, priority, ownerId, dueDate } = await request.json();

    if (!title || !ownerId) {
      return NextResponse.json(
        { error: "Titel und Kunde erforderlich" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        title,
        description: description || null,
        status: status || "PLANNING",
        priority: priority || "MEDIUM",
        ownerId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await logActivity(user.id, "CREATE", "Project", project.id, title);

    return NextResponse.json({ id: project.id });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
