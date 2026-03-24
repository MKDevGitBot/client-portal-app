"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export function AddTaskForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const data = {
      projectId,
      title: form.get("title") as string,
      description: form.get("description") as string,
      priority: form.get("priority") as string,
      dueDate: form.get("dueDate") as string || null,
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Fehler");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary text-sm">
        <Plus className="h-4 w-4" /> Aufgabe
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-surface-700 dark:bg-surface-800">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">Neue Aufgabe</span>
        <button type="button" onClick={() => setOpen(false)} className="text-surface-400 hover:text-surface-600">
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
      <input name="title" required placeholder="Titel" className="input mb-2" />
      <textarea name="description" rows={2} placeholder="Beschreibung (optional)" className="input mb-2" />
      <div className="grid grid-cols-2 gap-2">
        <select name="priority" className="input">
          <option value="MEDIUM">Mittel</option>
          <option value="LOW">Niedrig</option>
          <option value="HIGH">Hoch</option>
        </select>
        <input name="dueDate" type="date" className="input" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary mt-3 w-full text-sm">
        {loading ? "Erstellen..." : "Aufgabe erstellen"}
      </button>
    </form>
  );
}

export function ToggleTaskStatus({ taskId, currentStatus }: { taskId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const nextStatus: Record<string, string> = {
    TODO: "IN_PROGRESS",
    IN_PROGRESS: "REVIEW",
    REVIEW: "DONE",
    DONE: "TODO",
  };

  async function toggle() {
    setLoading(true);
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus[currentStatus] || "DONE" }),
      });
      router.refresh();
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={toggle} disabled={loading} className="badge cursor-pointer hover:opacity-80" style={{ minWidth: 80 }}>
      {currentStatus === "DONE" ? "✓ Erledigt" :
       currentStatus === "IN_PROGRESS" ? "⏳ In Arbeit" :
       currentStatus === "REVIEW" ? "👁 Review" : "○ Offen"}
    </button>
  );
}
