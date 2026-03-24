import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EditUserForm } from "./edit-user-form";

export default async function EditUserPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  // "new" means creating a new user
  if (params.id === "new") {
    return (
      <div>
        <h1 className="mb-8 text-2xl font-bold text-surface-900 dark:text-surface-100">
          Neuen Benutzer erstellen
        </h1>
        <div className="card max-w-xl">
          <EditUserForm />
        </div>
      </div>
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      company: true,
    },
  });

  if (!targetUser) redirect("/admin/users");

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-surface-900 dark:text-surface-100">
        Benutzer bearbeiten: {targetUser.name}
      </h1>
      <div className="card max-w-xl">
        <EditUserForm user={targetUser} />
      </div>
    </div>
  );
}
