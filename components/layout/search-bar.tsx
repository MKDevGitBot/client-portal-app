"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, FolderKanban, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: "project" | "invoice" | "message";
  href: string;
}

const typeIcons: Record<string, React.ElementType> = {
  project: FolderKanban,
  invoice: FileText,
  message: MessageSquare,
};

const typeLabels: Record<string, string> = {
  project: "Projekt",
  invoice: "Rechnung",
  message: "Nachricht",
};

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setOpen(true);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Group results by type
  const grouped: Record<string, SearchResult[]> = {};
  results.forEach((r) => {
    if (!grouped[r.type]) grouped[r.type] = [];
    grouped[r.type].push(r);
  });

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
        <input
          type="text"
          placeholder="Suchen..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          className="w-full rounded-lg border border-surface-200 bg-surface-50 py-2 pl-10 pr-8 text-sm placeholder:text-surface-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:placeholder:text-surface-500 dark:focus:border-primary-500 dark:focus:bg-surface-900"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-surface-400 hover:text-surface-600"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800">
          {loading ? (
            <div className="p-4 text-center text-sm text-surface-400">
              Suche...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-surface-400">
              Keine Ergebnisse für &quot;{query}&quot;
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="border-b border-surface-100 bg-surface-50 px-3 py-1.5 text-xs font-medium text-surface-500 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-400">
                    {typeLabels[type] || type} ({items.length})
                  </div>
                  {items.map((item) => {
                    const Icon = typeIcons[item.type] || FolderKanban;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => {
                          setOpen(false);
                          setQuery("");
                        }}
                        className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-surface-50 dark:hover:bg-surface-700"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-surface-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-surface-900 dark:text-surface-100">
                            {item.title}
                          </p>
                          {item.subtitle && (
                            <p className="truncate text-xs text-surface-400">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
