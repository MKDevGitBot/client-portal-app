"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white font-bold">
          CP
        </div>
        <h1 className="text-xl font-semibold text-surface-900">
          Client Portal
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Anmelden um fortzufahren
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-surface-700"
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
            className="mb-1.5 block text-sm font-medium text-surface-700"
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

      <div className="mt-6 rounded-lg bg-surface-50 p-4 text-center text-xs text-surface-500">
        <p className="font-medium text-surface-600 mb-1">Demo-Zugänge:</p>
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
