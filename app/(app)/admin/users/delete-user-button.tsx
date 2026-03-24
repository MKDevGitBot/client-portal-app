"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function DeleteUserButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (
      !confirm(
        `Benutzer "${userName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        showToast(data.error || "Fehler beim Löschen", "error");
        return;
      }
      showToast("Benutzer gelöscht", "success");
      router.refresh();
    } catch {
      showToast("Verbindungsfehler", "error");
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg p-2 text-surface-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
      title="Löschen"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
