import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
      createdAt: true,
      _count: {
        select: {
          ownedProjects: true,
          invoices: true,
          sessions: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role, company } = await request.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, E-Mail und Passwort erforderlich" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "E-Mail bereits vergeben" },
      { status: 400 }
    );
  }

  const hashed = await hashPassword(password);
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: role || "CLIENT",
      company: company || null,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  await logActivity(user.id, "CREATE", "User", newUser.id, `Benutzer erstellt: ${email}`);

  return NextResponse.json({ user: newUser });
}
