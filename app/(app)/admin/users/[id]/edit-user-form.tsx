"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company: string | null;
}

export function EditUserForm({ user }: { user?: User }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const isNew = !user;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      const v = value.toString().trim();
      if (v) data[key] = v;
    });

    try {
      const url = isNew ? "/api/admin/users" : `/api/admin/users/${user!.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || "Fehler", "error");
        return;
      }

      showToast(
        isNew ? "Benutzer erstellt" : "Benutzer aktualisiert",
        "success"
      );
      router.push("/admin/users");
      router.refresh();
    } catch {
      showToast("Verbindungsfehler", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Name *
        </label>
        <input
          name="name"
          required
          defaultValue={user?.name}
          className="input"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          E-Mail *
        </label>
        <input
          name="email"
          type="email"
          required
          defaultValue={user?.email}
          className="input"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          {isNew ? "Passwort *" : "Neues Passwort (leer lassen = unverändert)"}
        </label>
        <input
          name="password"
          type="password"
          required={isNew}
          minLength={6}
          className="input"
          placeholder={isNew ? "••••••••" : "Unverändert"}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Firma
        </label>
        <input
          name="company"
          defaultValue={user?.company || ""}
          className="input"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Rolle
        </label>
        <select
          name="role"
          defaultValue={user?.role || "CLIENT"}
          className="input"
        >
          <option value="CLIENT">Kunde</option>
          <option value="ADMIN">Administrator</option>
        </select>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Speichern..." : isNew ? "Erstellen" : "Speichern"}
        </button>
        <a href="/admin/users" className="btn-secondary">
          Abbrechen
        </a>
      </div>
    </form>
  );
}
