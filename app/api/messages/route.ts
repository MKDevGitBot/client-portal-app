import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { projectId, content, type } = await request.json();

    if (!projectId || !content) {
      return NextResponse.json(
        { error: "Projekt und Nachricht erforderlich" },
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

    const message = await prisma.message.create({
      data: {
        projectId,
        senderId: user.id,
        content,
        type: type || "GENERAL",
      },
    });

    return NextResponse.json({ id: message.id });
  } catch (error) {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
