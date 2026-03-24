import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain", "text/csv", "text/html", "text/css", "text/javascript",
  "application/zip",
];

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

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Datei zu groß (max. 10MB)" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Dateityp nicht erlaubt: ${file.type}` },
        { status: 400 }
      );
    }

    // Sanitize filename
    const safeName = basename(file.name).replace(/[^a-zA-Z0-9._-]/g, "_");

    // Create uploads directory
    const uploadDir = join(process.cwd(), "public", "uploads", projectId || "general");
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${Date.now()}-${safeName}`;
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
