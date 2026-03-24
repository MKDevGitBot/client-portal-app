"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, CheckCircle2, Circle, Trash2 } from "lucide-react";

export function AddMilestoneForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      projectId,
      title: form.get("title") as string,
      description: form.get("description") as string,
      dueDate: form.get("dueDate") as string || null,
    };

    try {
      await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setOpen(false);
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        <Plus className="h-4 w-4" /> Meilenstein
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Neuer Meilenstein</span>
        <button type="button" onClick={() => setOpen(false)} className="text-surface-400 hover:text-surface-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      <input name="title" required placeholder="Titel" className="input mb-2" />
      <textarea name="description" rows={2} placeholder="Beschreibung (optional)" className="input mb-2" />
      <input name="dueDate" type="date" className="input mb-2" />
      <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
        {loading ? "Erstellen..." : "Meilenstein erstellen"}
      </button>
    </form>
  );
}

export function ToggleMilestone({ milestoneId, completed }: { milestoneId: string; completed: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/milestones/${milestoneId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className="shrink-0">
      {completed ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <Circle className="h-5 w-5 text-surface-300 hover:text-primary-500" />
      )}
    </button>
  );
}

export function DeleteItem({ type, id }: { type: "task" | "milestone"; id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Wirklich löschen?")) return;
    setLoading(true);
    try {
      const url = type === "task" ? `/api/tasks/${id}` : `/api/milestones/${id}`;
      await fetch(url, { method: "DELETE" });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="shrink-0 text-surface-400 hover:text-red-500">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
