"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Props {
  clients: { id: string; name: string; company: string | null }[];
}

export default function NewProjectPage({ clients }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const data = {
      title: form.get("title") as string,
      description: form.get("description") as string,
      status: form.get("status") as string,
      priority: form.get("priority") as string,
      ownerId: form.get("ownerId") as string,
      dueDate: form.get("dueDate") as string || null,
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Fehler beim Erstellen");
        return;
      }

      router.push("/projects");
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link
        href="/projects"
        className="mb-6 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-300"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Projekten
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-surface-900 dark:text-surface-100">
        Neues Projekt erstellen
      </h1>

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Titel *
          </label>
          <input
            name="title"
            required
            className="input"
            placeholder="z.B. Website Relaunch"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Beschreibung
          </label>
          <textarea
            name="description"
            rows={3}
            className="input"
            placeholder="Kurze Beschreibung des Projekts..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Kunde *
          </label>
          <select name="ownerId" required className="input">
            <option value="">Kunde wählen...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.company ? ` (${c.company})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Status
            </label>
            <select name="status" className="input">
              <option value="PLANNING">Planung</option>
              <option value="DESIGN">Design</option>
              <option value="DEVELOPMENT">Entwicklung</option>
              <option value="REVIEW">Review</option>
              <option value="LAUNCH">Launch</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
              Priorität
            </label>
            <select name="priority" className="input">
              <option value="MEDIUM">Mittel</option>
              <option value="LOW">Niedrig</option>
              <option value="HIGH">Hoch</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Fälligkeitsdatum
          </label>
          <input name="dueDate" type="date" className="input" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? "Erstellen..." : "Projekt erstellen"}
        </button>
      </form>
    </div>
  );
}
