import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PasswordChangeForm } from "./password-change-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Einstellungen
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          Konto und Sicherheit
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Info */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Kontoinformationen
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">
                Name
              </dt>
              <dd className="text-sm text-surface-900 dark:text-surface-100">
                {user.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">
                E-Mail
              </dt>
              <dd className="text-sm text-surface-900 dark:text-surface-100">
                {user.email}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">
                Rolle
              </dt>
              <dd className="text-sm text-surface-900 dark:text-surface-100">
                {user.role === "ADMIN" ? "Administrator" : "Kunde"}
              </dd>
            </div>
            {user.company && (
              <div>
                <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">
                  Firma
                </dt>
                <dd className="text-sm text-surface-900 dark:text-surface-100">
                  {user.company}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Password Change */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-surface-900 dark:text-surface-100">
            Passwort ändern
          </h2>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
}
