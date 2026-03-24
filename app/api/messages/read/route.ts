import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const { messageIds, projectId } = await request.json();

    if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      const existing = await prisma.messageRead.findMany({
        where: {
          messageId: { in: messageIds },
          userId: user.id,
        },
        select: { messageId: true },
      });

      const existingIds = new Set(existing.map((r) => r.messageId));
      const newIds = messageIds.filter((id: string) => !existingIds.has(id));

      if (newIds.length > 0) {
        await prisma.messageRead.createMany({
          data: newIds.map((messageId: string) => ({
            messageId,
            userId: user.id,
          })),
        });
      }
    } else if (projectId) {
      // Mark all messages in project as read
      const unread = await prisma.message.findMany({
        where: {
          projectId,
          reads: { none: { userId: user.id } },
        },
        select: { id: true },
      });

      if (unread.length > 0) {
        await prisma.messageRead.createMany({
          data: unread.map((m) => ({
            messageId: m.id,
            userId: user.id,
          })),
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
