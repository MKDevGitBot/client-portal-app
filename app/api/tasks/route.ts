import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur Admins" }, { status: 403 });
    }

    const { projectId, title, description, priority, dueDate, assigneeId } = await request.json();

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Projekt und Titel erforderlich" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description: description || null,
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
      },
    });

    await logActivity(user.id, "CREATE", "Task", task.id, title);

    return NextResponse.json({ id: task.id });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
