import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project statuses
    PLANNING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    DESIGN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    DEVELOPMENT: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
    REVIEW: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    LAUNCH: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    COMPLETED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
    // Task statuses
    TODO: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    DONE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    // Invoice statuses
    DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    SENT: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    PAID: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    OVERDUE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    // Priority
    LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

export function getProgressForStatus(status: string): number {
  const progress: Record<string, number> = {
    PLANNING: 10,
    DESIGN: 30,
    DEVELOPMENT: 60,
    REVIEW: 80,
    LAUNCH: 95,
    COMPLETED: 100,
  };
  return progress[status] || 0;
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
