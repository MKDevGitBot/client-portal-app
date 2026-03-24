import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const projectId = formData.get("projectId") as string;
    const category = (formData.get("category") as string) || "GENERAL";

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    // Create uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads", projectId || "general");
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${file.name}`;
    const filepath = join(uploadDir, filename);

    await writeFile(filepath, buffer);

    // Save to database
    const upload = await prisma.fileUpload.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: buffer.length,
        path: `/uploads/${projectId || "general"}/${filename}`,
        category,
        projectId: projectId || null,
        uploaderId: user.id,
      },
    });

    return NextResponse.json({ id: upload.id, path: upload.path });
  } catch (error) {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
