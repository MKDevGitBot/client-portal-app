import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = user.role === "ADMIN";
    const where = isAdmin ? {} : { project: { ownerId: user.id } };

    const messages = await prisma.message.findMany({
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

    // Count unread messages
    const unreadCount = messages.filter((m) => m.reads.length === 0).length;

    return NextResponse.json({ messages, unreadCount });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { projectId, content, type, attachmentUrl } = await request.json();

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
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, title: true } },
      },
    });

    // Mark as read for sender
    await prisma.messageRead.create({
      data: { messageId: message.id, userId: user.id },
    });

    // Broadcast via SSE
    try {
      const { broadcastToClients } = await import("@/lib/sse");
      broadcastToClients({
        type: "new_message",
        message: {
          ...message,
          reads: [{ readAt: new Date() }],
        },
      });
    } catch {
      // SSE broadcast failed - non-critical
    }

    return NextResponse.json({ id: message.id });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
