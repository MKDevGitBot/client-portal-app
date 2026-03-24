"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";

export function PasswordChangeForm() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
      showToast("Passwörter stimmen nicht überein", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("Passwort muss mindestens 6 Zeichen lang sein", "warning");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Fehler", "error");
        return;
      }

      showToast("Passwort erfolgreich geändert", "success");
      (e.target as HTMLFormElement).reset();
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
          Aktuelles Passwort
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Neues Passwort
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={6}
          className="input"
          placeholder="••••••••"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Neues Passwort bestätigen
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          className="input"
          placeholder="••••••••"
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? "Speichern..." : "Passwort ändern"}
      </button>
    </form>
  );
}
