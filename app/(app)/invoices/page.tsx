import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { cn, formatDate, formatCurrency, getStatusColor } from "@/lib/utils";

export default async function InvoicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const where = isAdmin ? {} : { clientId: user.id };

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      project: { select: { title: true } },
      client: { select: { name: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.amount, 0);
  const openAmount = totalAmount - paidAmount;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Rechnungen</h1>
        <p className="mt-1 text-surface-500">
          {invoices.length} Rechnungen insgesamt
        </p>
      </div>

      {/* Summary */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card text-center">
          <p className="text-2xl font-bold text-surface-900">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-surface-500">Gesamtbetrag</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(paidAmount)}
          </p>
          <p className="text-sm text-surface-500">Bezahlt</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-amber-600">
            {formatCurrency(openAmount)}
          </p>
          <p className="text-sm text-surface-500">Offen</p>
        </div>
      </div>

      {/* Invoice List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-200 text-left text-sm text-surface-500">
                <th className="pb-3 font-medium">Nr.</th>
                <th className="pb-3 font-medium">Titel</th>
                <th className="pb-3 font-medium">Projekt</th>
                {isAdmin && <th className="pb-3 font-medium">Kunde</th>}
                <th className="pb-3 font-medium">Betrag</th>
                <th className="pb-3 font-medium">Fällig</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {invoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="py-8 text-center text-surface-400"
                  >
                    Keine Rechnungen vorhanden
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-surface-50">
                    <td className="py-3 text-sm font-mono text-surface-600">
                      {invoice.number}
                    </td>
                    <td className="py-3 text-sm font-medium text-surface-900">
                      {invoice.title}
                    </td>
                    <td className="py-3 text-sm text-surface-500">
                      {invoice.project.title}
                    </td>
                    {isAdmin && (
                      <td className="py-3 text-sm text-surface-500">
                        {invoice.client.name}
                        {invoice.client.company && (
                          <span className="text-surface-400">
                            {" "}
                            ({invoice.client.company})
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-3 text-sm font-semibold text-surface-900">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="py-3 text-sm text-surface-500">
                      {invoice.dueDate
                        ? formatDate(invoice.dueDate)
                        : "—"}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "badge",
                          getStatusColor(invoice.status)
                        )}
                      >
                        {invoice.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
