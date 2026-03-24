"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
}

export function MessageComposer({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: formData.get("projectId"),
          content: formData.get("content"),
          type: formData.get("type") || "GENERAL",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Senden");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h3 className="mb-4 text-lg font-semibold text-surface-900">
        Neue Nachricht
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Projekt *
          </label>
          <select name="projectId" required className="input">
            <option value="">Projekt wählen...</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Art
          </label>
          <select name="type" className="input">
            <option value="GENERAL">Allgemein</option>
            <option value="UPDATE">Update</option>
            <option value="FEEDBACK">Feedback</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Nachricht *
          </label>
          <textarea
            name="content"
            required
            rows={4}
            className="input"
            placeholder="Schreibe deine Nachricht..."
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Wird gesendet..." : "Nachricht senden"}
        </button>
      </form>
    </div>
  );
}
