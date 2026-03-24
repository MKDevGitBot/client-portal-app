import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            Benutzerverwaltung
          </h1>
          <p className="mt-1 text-surface-500 dark:text-surface-400">
            {users.length} Benutzer registriert
          </p>
        </div>
        <Link href="/admin/users/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Neuer Benutzer
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-200 text-left text-sm text-surface-500 dark:border-surface-700 dark:text-surface-400">
              <th className="pb-3 font-medium">Name</th>
              <th className="pb-3 font-medium">E-Mail</th>
              <th className="pb-3 font-medium">Firma</th>
              <th className="pb-3 font-medium">Rolle</th>
              <th className="pb-3 font-medium">Projekte</th>
              <th className="pb-3 font-medium">Rechnungen</th>
              <th className="pb-3 font-medium">Registriert</th>
              <th className="pb-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
            {users.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-surface-50 dark:hover:bg-surface-800/50"
              >
                <td className="py-3 text-sm font-medium text-surface-900 dark:text-surface-100">
                  {u.name}
                </td>
                <td className="py-3 text-sm text-surface-600 dark:text-surface-400">
                  {u.email}
                </td>
                <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                  {u.company || "—"}
                </td>
                <td className="py-3">
                  <span
                    className={cn(
                      "badge",
                      u.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400"
                    )}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                  {u._count.ownedProjects}
                </td>
                <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                  {u._count.invoices}
                </td>
                <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                  {formatDate(u.createdAt)}
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
                      title="Bearbeiten"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    {u.id !== user.id && (
                      <DeleteUserButton userId={u.id} userName={u.name} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
