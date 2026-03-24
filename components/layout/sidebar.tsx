"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  Upload,
  LogOut,
  User,
  FolderOpen,
  Settings,
  Shield,
  Users,
  Activity,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projekte", icon: FolderKanban },
  { href: "/intake", label: "Daten einreichen", icon: Upload },
  { href: "/invoices", label: "Rechnungen", icon: FileText },
  { href: "/messages", label: "Nachrichten", icon: MessageSquare },
  { href: "/files", label: "Dateien", icon: FolderOpen },
];

const adminItems = [
  { href: "/admin/users", label: "Benutzer", icon: Users },
  { href: "/admin/activity", label: "Aktivitäten", icon: Activity },
  { href: "/admin/sessions", label: "Sitzungen", icon: Shield },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    company?: string | null;
  };
  onClose?: () => void;
}

export function Sidebar({ user, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user?.role === "ADMIN";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between gap-2 border-b border-surface-200 px-6 dark:border-surface-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            CP
          </div>
          <span className="font-semibold text-surface-900 dark:text-surface-100">
            Client Portal
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 lg:hidden"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t border-surface-200 dark:border-surface-700" />
            <p className="mb-1 px-3 text-xs font-medium uppercase tracking-wider text-surface-400 dark:text-surface-500">
              Administration
            </p>
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                      : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Theme + Settings */}
      <div className="border-t border-surface-200 px-3 py-2 dark:border-surface-800">
        <ThemeToggle />
        <Link
          href="/settings"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
        >
          <Settings className="h-4 w-4" />
          Einstellungen
        </Link>
      </div>

      {/* User */}
      <div className="border-t border-surface-200 p-4 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-200 dark:bg-surface-700">
            <User className="h-4 w-4 text-surface-600 dark:text-surface-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
              {user?.name || "Gast"}
            </p>
            <p className="truncate text-xs text-surface-500 dark:text-surface-400">
              {user?.company || user?.email || ""}
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
