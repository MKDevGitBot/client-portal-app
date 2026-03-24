"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  title: string;
  status: string;
}

export function IntakeForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const data = {
      projectId: formData.get("projectId") as string,
      type: formData.get("type") as string,
      companyName: formData.get("companyName") as string,
      companyDescription: formData.get("companyDescription") as string,
      targetAudience: formData.get("targetAudience") as string,
      brandColors: formData.get("brandColors") as string,
      brandFonts: formData.get("brandFonts") as string,
      contentText: formData.get("contentText") as string,
      specialRequirements: formData.get("specialRequirements") as string,
      existingWebsite: formData.get("existingWebsite") as string,
      competitors: formData.get("competitors") as string,
    };

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || "Fehler beim Einreichen");
        return;
      }

      setSuccess(true);
      form.reset();
      router.refresh();
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="mb-4 text-lg font-semibold text-surface-900">
        Projekt-Daten einreichen
      </h3>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          ✅ Daten erfolgreich eingereicht!
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-4">
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
            Art der Einreichung *
          </label>
          <select name="type" required className="input">
            <option value="BRANDING">Branding & Design</option>
            <option value="CONTENT">Texte & Inhalte</option>
            <option value="CONTACT">Kontaktdaten</option>
            <option value="GENERAL">Allgemein</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Firmenname
          </label>
          <input name="companyName" className="input" placeholder="Ihre Firma GmbH" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Firmenbeschreibung
          </label>
          <textarea
            name="companyDescription"
            rows={3}
            className="input"
            placeholder="Was macht Ihr Unternehmen?"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Zielgruppe
          </label>
          <input
            name="targetAudience"
            className="input"
            placeholder="z.B. B2B, Privatkunden, 25-45 Jahre"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Markenfarben
            </label>
            <input
              name="brandColors"
              className="input"
              placeholder="#a3cf62, #00a5e5"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-surface-700">
              Schriftarten
            </label>
            <input
              name="brandFonts"
              className="input"
              placeholder="Inter, Roboto"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Texte & Inhalte
          </label>
          <textarea
            name="contentText"
            rows={5}
            className="input"
            placeholder="Fügen Sie hier Ihre Texte ein..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Besondere Anforderungen
          </label>
          <textarea
            name="specialRequirements"
            rows={2}
            className="input"
            placeholder="Gibt es spezielle Wünsche?"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Bestehende Website (URL)
          </label>
          <input
            name="existingWebsite"
            type="url"
            className="input"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-surface-700">
            Wettbewerber
          </label>
          <input
            name="competitors"
            className="input"
            placeholder="Wer sind Ihre Konkurrenten?"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Wird eingereicht..." : "Daten einreichen"}
        </button>
      </div>
    </form>
  );
}
