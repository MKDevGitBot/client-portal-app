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

    const { projectId, title, description, dueDate } = await request.json();

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "Projekt und Titel erforderlich" },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await logActivity(user.id, "CREATE", "Milestone", milestone.id, title);

    return NextResponse.json({ id: milestone.id });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
