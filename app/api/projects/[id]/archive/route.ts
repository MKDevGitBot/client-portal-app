import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { archived: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projekt nicht gefunden" },
        { status: 404 }
      );
    }

    await prisma.project.update({
      where: { id: params.id },
      data: { archived: !project.archived },
    });

    return NextResponse.redirect(
      new URL(`/projects/${params.id}`, request.url)
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
