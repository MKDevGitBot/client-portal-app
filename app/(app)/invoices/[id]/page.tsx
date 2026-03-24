import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { cn, formatDate, formatCurrency, getStatusColor } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Calendar,
  CreditCard,
  Bell,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface Props {
  params: { id: string };
}

export default async function InvoiceDetailPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: {
      project: { select: { id: true, title: true } },
      client: { select: { name: true, company: true, email: true } },
    },
  });

  if (!invoice) notFound();

  // Check access
  if (user.role !== "ADMIN" && invoice.clientId !== user.id) {
    redirect("/invoices");
  }

  const reminderLabels: Record<string, { label: string; icon: typeof Bell; color: string }> = {
    NONE: { label: "Keine Erinnerung", icon: Bell, color: "text-surface-400" },
    REMINDED: { label: "Erinnerung gesendet", icon: AlertTriangle, color: "text-amber-500" },
    FINAL_NOTICE: { label: "Mahnung gesendet", icon: AlertTriangle, color: "text-red-500" },
  };

  const reminder = reminderLabels[invoice.reminderStatus] || reminderLabels.NONE;
  const ReminderIcon = reminder.icon;

  return (
    <div>
      <Link
        href="/invoices"
        className="mb-6 inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Rechnungen
      </Link>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Rechnung {invoice.number}
          </h1>
          <p className="mt-1 text-surface-500">{invoice.title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("badge", getStatusColor(invoice.status))}>
            {invoice.status}
          </span>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Download className="h-4 w-4" />
            PDF herunterladen
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details Card */}
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-surface-900">
              Rechnungsdetails
            </h3>

            {/* Amount Breakdown */}
            <div className="mb-6 rounded-lg bg-surface-50 p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-500">Nettobetrag</span>
                  <span className="font-medium text-surface-900">
                    {formatCurrency(invoice.amount)}
                  </span>
                </div>
                {invoice.vatRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-500">
                      MwSt. ({invoice.vatRate}%)
                    </span>
                    <span className="font-medium text-surface-900">
                      {formatCurrency(invoice.vatAmount)}
                    </span>
                  </div>
                )}
                <div className="border-t border-surface-200 pt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-surface-900">
                      Gesamtbetrag
                    </span>
                    <span className="text-lg font-bold text-surface-900">
                      {formatCurrency(invoice.totalAmount || invoice.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {invoice.description && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-surface-500 mb-1">
                  Beschreibung
                </h4>
                <p className="text-sm text-surface-700">{invoice.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-surface-500">Rechnungsnummer</p>
                <p className="font-medium font-mono text-surface-900">
                  {invoice.number}
                </p>
              </div>
              <div>
                <p className="text-surface-500">Währung</p>
                <p className="font-medium text-surface-900">{invoice.currency}</p>
              </div>
              <div>
                <p className="text-surface-500">Erstellt am</p>
                <p className="font-medium text-surface-900">
                  {formatDate(invoice.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-surface-500">Zuletzt aktualisiert</p>
                <p className="font-medium text-surface-900">
                  {formatDate(invoice.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-surface-700">
              Status
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-500">Fälligkeitsdatum</p>
                  <p className="text-sm font-medium text-surface-900">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : "Nicht festgelegt"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-500">Bezahlungsstatus</p>
                  <span className={cn("badge", getStatusColor(invoice.status))}>
                    {invoice.status === "PAID"
                      ? "Bezahlt"
                      : invoice.status === "OVERDUE"
                      ? "Überfällig"
                      : invoice.status}
                  </span>
                </div>
              </div>

              {invoice.paidDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-surface-500">Bezahlt am</p>
                    <p className="text-sm font-medium text-surface-900">
                      {formatDate(invoice.paidDate)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <ReminderIcon className={cn("h-4 w-4", reminder.color)} />
                <div>
                  <p className="text-xs text-surface-500">Mahnstatus</p>
                  <p className="text-sm font-medium text-surface-900">
                    {reminder.label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project */}
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-surface-700">
              Projekt
            </h3>
            <Link
              href={`/projects/${invoice.project.id}`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {invoice.project.title}
            </Link>
          </div>

          {/* Client */}
          <div className="card">
            <h3 className="mb-4 text-sm font-semibold text-surface-700">Kunde</h3>
            <p className="text-sm font-medium text-surface-900">
              {invoice.client.name}
            </p>
            {invoice.client.company && (
              <p className="text-sm text-surface-500">{invoice.client.company}</p>
            )}
            <p className="text-sm text-surface-500">{invoice.client.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
