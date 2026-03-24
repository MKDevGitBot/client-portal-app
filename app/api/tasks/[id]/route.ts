import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur Admins" }, { status: 403 });
    }

    const { status, title, description, priority, dueDate } = await request.json();

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
    });

    await logActivity(user.id, "UPDATE", "Task", task.id, status ? `Status: ${status}` : title);

    return NextResponse.json({ id: task.id });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nur Admins" }, { status: 403 });
    }

    await prisma.task.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
