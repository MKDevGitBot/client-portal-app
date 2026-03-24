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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projekte", icon: FolderKanban },
  { href: "/intake", label: "Daten einreichen", icon: Upload },
  { href: "/invoices", label: "Rechnungen", icon: FileText },
  { href: "/messages", label: "Nachrichten", icon: MessageSquare },
  { href: "/files", label: "Dateien", icon: FolderOpen },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
    company?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-surface-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-surface-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
          CP
        </div>
        <span className="font-semibold text-surface-900">Client Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-surface-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-200">
            <User className="h-4 w-4 text-surface-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-surface-900">
              {user?.name || "Gast"}
            </p>
            <p className="truncate text-xs text-surface-500">
              {user?.company || user?.email || ""}
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
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
