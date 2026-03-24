import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import FilesPageClient from "./files-client";

export default async function FilesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";

  const rawFiles = await prisma.fileUpload.findMany({
    where: isAdmin ? {} : { uploaderId: user.id },
    include: {
      uploader: { select: { name: true } },
      project: { select: { id: true, title: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const files = rawFiles.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
  }));

  return <FilesPageClient initialFiles={files} userId={user.id} />;
}
