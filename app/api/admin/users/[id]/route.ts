import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, role, company, password } = await request.json();
  const targetId = params.id;

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json(
      { error: "Benutzer nicht gefunden" },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (company !== undefined) updateData.company = company;
  if (password) updateData.password = await hashPassword(password);

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true },
  });

  await logActivity(user.id, "UPDATE", "User", targetId, `Benutzer aktualisiert: ${target.email}`);

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetId = params.id;

  if (targetId === user.id) {
    return NextResponse.json(
      { error: "Eigenes Konto kann nicht gelöscht werden" },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json(
      { error: "Benutzer nicht gefunden" },
      { status: 404 }
    );
  }

  await prisma.user.delete({ where: { id: targetId } });
  await logActivity(user.id, "DELETE", "User", targetId, `Benutzer gelöscht: ${target.email}`);

  return NextResponse.json({ success: true });
}
