"use client";

import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";
import {
  FileText,
  Image,
  File,
  Download,
  MessageSquare,
  Grid3X3,
  List,
  Search,
} from "lucide-react";
import Link from "next/link";
import FileComments from "@/components/files/file-comments";

interface FileItem {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  category: string;
  createdAt: string;
  uploader: { name: string };
  project: { id: string; title: string } | null;
  _count: { comments: number };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
}

function isImage(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default function FilesPageClient({
  initialFiles,
  userId,
}: {
  initialFiles: FileItem[];
  userId: string;
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const filteredFiles = initialFiles.filter((f) => {
    const matchesSearch =
      !search || f.originalName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      categoryFilter === "ALL" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "ALL", label: "Alle" },
    { value: "GENERAL", label: "Allgemein" },
    { value: "BRANDING", label: "Branding" },
    { value: "CONTENT", label: "Inhalte" },
    { value: "DESIGN", label: "Design" },
    { value: "DOCUMENT", label: "Dokumente" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Dateien
        </h1>
        <p className="mt-1 text-surface-500 dark:text-surface-400">
          {initialFiles.length} Dateien insgesamt
        </p>
      </div>

      {/* Filters & View Toggle */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            placeholder="Dateien suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-auto"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="flex rounded-lg border border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-l-lg",
              viewMode === "grid"
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                : "text-surface-400 hover:text-surface-600"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-r-lg",
              viewMode === "list"
                ? "bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                : "text-surface-400 hover:text-surface-600"
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="card py-16 text-center">
          <File className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600" />
          <p className="mt-4 text-surface-400">Keine Dateien gefunden</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredFiles.map((file) => {
            const Icon = getFileIcon(file.mimeType);
            return (
              <div key={file.id} className="card group overflow-hidden">
                <div className="relative mb-3 flex h-32 items-center justify-center overflow-hidden rounded-lg bg-surface-50 dark:bg-surface-800">
                  {isImage(file.mimeType) ? (
                    <img
                      src={file.path}
                      alt={file.originalName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="h-12 w-12 text-surface-300 dark:text-surface-600" />
                  )}
                </div>

                <p className="truncate text-sm font-medium text-surface-900 dark:text-surface-100">
                  {file.originalName}
                </p>
                <p className="text-xs text-surface-400">
                  {formatFileSize(file.size)} · {formatDate(file.createdAt)}
                </p>
                <p className="text-xs text-surface-400">
                  von {file.uploader.name}
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={file.path}
                    download={file.originalName}
                    className="flex-1 rounded-lg bg-surface-100 px-2 py-1.5 text-center text-xs font-medium text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                  >
                    <Download className="mx-auto h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() =>
                      setSelectedFile(selectedFile === file.id ? null : file.id)
                    }
                    className="flex items-center gap-1 rounded-lg bg-surface-100 px-2 py-1.5 text-xs text-surface-600 hover:bg-surface-200 dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {file._count.comments > 0 && (
                      <span>{file._count.comments}</span>
                    )}
                  </button>
                </div>

                {selectedFile === file.id && (
                  <div className="mt-3 border-t border-surface-100 pt-3 dark:border-surface-800">
                    <FileComments fileId={file.id} userId={userId} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 text-left text-sm text-surface-500 dark:border-surface-700 dark:text-surface-400">
                <th className="pb-3 font-medium">Datei</th>
                <th className="pb-3 font-medium">Kategorie</th>
                <th className="pb-3 font-medium">Größe</th>
                <th className="pb-3 font-medium">Projekt</th>
                <th className="pb-3 font-medium">Hochgeladen</th>
                <th className="pb-3 font-medium">Kommentare</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
              {filteredFiles.map((file) => {
                const Icon = getFileIcon(file.mimeType);
                return (
                  <tr key={file.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-100 dark:bg-surface-800">
                          <Icon className="h-4 w-4 text-surface-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-surface-400">
                            von {file.uploader.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="badge bg-surface-100 text-xs dark:bg-surface-800">
                        {file.category}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                      {file.project ? (
                        <Link
                          href={`/projects/${file.project.id}`}
                          className="hover:text-primary-600"
                        >
                          {file.project.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                      {formatDate(file.createdAt)}
                    </td>
                    <td className="py-3 text-sm text-surface-500 dark:text-surface-400">
                      {file._count.comments}
                    </td>
                    <td className="py-3">
                      <a
                        href={file.path}
                        download={file.originalName}
                        className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-800"
                        title="Herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
