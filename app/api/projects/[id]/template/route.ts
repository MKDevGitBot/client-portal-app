import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    const sourceId = params.id;

    // Fetch source project with all tasks and milestones
    const sourceProject = await prisma.project.findUnique({
      where: { id: sourceId },
      include: {
        tasks: true,
        milestones: true,
      },
    });

    if (!sourceProject) {
      return NextResponse.json(
        { error: "Projekt nicht gefunden" },
        { status: 404 }
      );
    }

    // Create new project from template
    const newProject = await prisma.project.create({
      data: {
        title: `${sourceProject.title} (Vorlage)`,
        description: sourceProject.description,
        status: "PLANNING",
        priority: sourceProject.priority,
        ownerId: sourceProject.ownerId,
      },
    });

    // Copy tasks
    if (sourceProject.tasks.length > 0) {
      await prisma.task.createMany({
        data: sourceProject.tasks.map((task) => ({
          title: task.title,
          description: task.description,
          status: "TODO",
          priority: task.priority,
          projectId: newProject.id,
        })),
      });
    }

    // Copy milestones
    if (sourceProject.milestones.length > 0) {
      await prisma.milestone.createMany({
        data: sourceProject.milestones.map((ms) => ({
          title: ms.title,
          description: ms.description,
          dueDate: ms.dueDate,
          completed: false,
          projectId: newProject.id,
        })),
      });
    }

    return NextResponse.json({
      id: newProject.id,
      message: "Dupliziert!",
      tasksCopied: sourceProject.tasks.length,
      milestonesCopied: sourceProject.milestones.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
