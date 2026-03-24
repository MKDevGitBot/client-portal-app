import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { projectId, type, ...formData } = body;

    if (!projectId || !type) {
      return NextResponse.json(
        { error: "Projekt und Typ erforderlich" },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projekt nicht gefunden" },
        { status: 404 }
      );
    }

    if (user.role !== "ADMIN" && project.ownerId !== user.id) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }

    const intake = await prisma.intake.create({
      data: {
        projectId,
        type,
        data: JSON.stringify(formData),
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: intake.id });
  } catch (error) {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
