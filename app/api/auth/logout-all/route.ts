import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/activity";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get current session token to keep it active
  const cookieStore = await cookies();
  const currentToken = cookieStore.get("session")?.value;

  // Delete all sessions except current one
  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      ...(currentToken ? { NOT: { token: currentToken } } : {}),
    },
  });

  await logActivity(user.id, "LOGOUT", "Session", undefined, "Alle Sitzungen beendet");

  return NextResponse.json({ success: true });
}
