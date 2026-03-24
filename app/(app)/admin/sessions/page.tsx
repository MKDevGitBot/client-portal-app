import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SessionsClient } from "./sessions-client";

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  // Get current session token
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const currentToken = cookieStore.get("session")?.value;
  const currentSession = currentToken
    ? await prisma.session.findUnique({
        where: { token: currentToken },
        select: { id: true },
      })
    : null;

  return (
    <SessionsClient
      sessions={sessions.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      }))}
      currentSessionId={currentSession?.id || ""}
    />
  );
}
