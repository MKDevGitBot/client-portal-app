import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const fileId = params.id;

    const comments = await prisma.fileComment.findMany({
      where: { fileId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const fileId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Kommentar erforderlich" },
        { status: 400 }
      );
    }

    // Verify file exists
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    const comment = await prisma.fileComment.create({
      data: {
        content: content.trim(),
        fileId,
        userId: user.id,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
