"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError(
        "Verbindungsfehler — Bitte überprüfe deine Internetverbindung."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card dark:border-surface-800 dark:bg-surface-900">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
          CP
        </div>
        <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100">
          Client Portal
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Anmelden um fortzufahren
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            E-Mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="du@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300"
          >
            Passwort
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Anmelden..." : "Anmelden"}
        </button>
      </form>

      <div className="mt-6 rounded-lg bg-surface-50 p-4 text-center text-xs text-surface-500 dark:bg-surface-800 dark:text-surface-400">
        <p className="mb-1 font-medium text-surface-600 dark:text-surface-300">
          Demo-Zugänge:
        </p>
        <p>
          <strong>Admin:</strong> admin@portal.de / admin123
        </p>
        <p>
          <strong>Kunde:</strong> kunde@example.de / kunde123
        </p>
      </div>
    </div>
  );
}
