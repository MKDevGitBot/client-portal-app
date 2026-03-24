import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { title: true } },
        client: { select: { name: true, company: true, email: true } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Rechnung nicht gefunden" }, { status: 404 });
    }

    // Check access
    if (user.role !== "ADMIN" && invoice.clientId !== user.id) {
      return NextResponse.json({ error: "Kein Zugriff" }, { status: 403 });
    }

    const totalAmount = invoice.totalAmount || invoice.amount;

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>Rechnung ${invoice.number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #2563eb; }
    .company-name { font-size: 24px; font-weight: 700; color: #2563eb; }
    .invoice-title { font-size: 28px; font-weight: 700; color: #1e293b; text-align: right; }
    .invoice-number { font-size: 14px; color: #64748b; text-align: right; margin-top: 4px; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
    .detail-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    .detail-value { font-size: 14px; }
    .detail-name { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f8fafc; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .amount-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
    .amount-label { width: 200px; text-align: right; padding-right: 20px; color: #64748b; font-size: 14px; }
    .amount-value { width: 120px; text-align: right; font-weight: 500; }
    .total-row { display: flex; justify-content: flex-end; border-top: 2px solid #1e293b; padding-top: 12px; margin-top: 12px; }
    .total-label { width: 200px; text-align: right; padding-right: 20px; font-weight: 700; font-size: 16px; }
    .total-value { width: 120px; text-align: right; font-weight: 700; font-size: 18px; color: #2563eb; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-draft { background: #f1f5f9; color: #64748b; }
    .status-sent { background: #dbeafe; color: #1d4ed8; }
    .status-paid { background: #dcfce7; color: #15803d; }
    .status-overdue { background: #fee2e2; color: #dc2626; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    .bank-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin-top: 30px; }
    .bank-title { font-weight: 600; margin-bottom: 8px; font-size: 14px; }
    .bank-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
    .bank-label { color: #64748b; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">Client Portal</div>
      <div style="color: #64748b; font-size: 13px; margin-top: 8px;">
        Freelancer Studio<br>
        Musterstraße 1<br>
        12345 Musterstadt
      </div>
    </div>
    <div>
      <div class="invoice-title">Rechnung</div>
      <div class="invoice-number">Nr. ${invoice.number}</div>
      <div style="margin-top: 8px;">
        <span class="status-badge status-${invoice.status.toLowerCase()}">
          ${invoice.status === "PAID" ? "Bezahlt" : invoice.status === "OVERDUE" ? "Überfällig" : invoice.status === "SENT" ? "Gesendet" : invoice.status}
        </span>
      </div>
    </div>
  </div>

  <div class="details">
    <div>
      <div class="detail-label">Kunde</div>
      <div class="detail-value detail-name">${invoice.client.name}</div>
      ${invoice.client.company ? `<div class="detail-value">${invoice.client.company}</div>` : ""}
      <div class="detail-value">${invoice.client.email}</div>
    </div>
    <div>
      <div style="margin-bottom: 12px;">
        <div class="detail-label">Rechnungsdatum</div>
        <div class="detail-value">${formatDate(invoice.createdAt)}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div class="detail-label">Fälligkeitsdatum</div>
        <div class="detail-value">${invoice.dueDate ? formatDate(invoice.dueDate) : "Sofort"}</div>
      </div>
      <div>
        <div class="detail-label">Projekt</div>
        <div class="detail-value">${invoice.project.title}</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Beschreibung</th>
        <th style="text-align: right;">Betrag</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${invoice.title}</strong>
          ${invoice.description ? `<br><span style="color: #64748b; font-size: 13px;">${invoice.description}</span>` : ""}
        </td>
        <td style="text-align: right; font-weight: 500;">${formatCurrency(invoice.amount)}</td>
      </tr>
    </tbody>
  </table>

  <div class="amount-row">
    <div class="amount-label">Nettobetrag</div>
    <div class="amount-value">${formatCurrency(invoice.amount)}</div>
  </div>
  ${invoice.vatRate > 0 ? `
  <div class="amount-row">
    <div class="amount-label">MwSt. (${invoice.vatRate}%)</div>
    <div class="amount-value">${formatCurrency(invoice.vatAmount)}</div>
  </div>` : ""}
  <div class="total-row">
    <div class="total-label">Gesamtbetrag</div>
    <div class="total-value">${formatCurrency(totalAmount)}</div>
  </div>

  <div class="bank-info">
    <div class="bank-title">Bankverbindung</div>
    <div class="bank-row">
      <span class="bank-label">IBAN</span>
      <span>DE00 0000 0000 0000 0000 00</span>
    </div>
    <div class="bank-row">
      <span class="bank-label">BIC</span>
      <span>XXXXXXXXXXX</span>
    </div>
    <div class="bank-row">
      <span class="bank-label">Verwendungszweck</span>
      <span>${invoice.number}</span>
    </div>
  </div>

  <div class="footer">
    <p>Vielen Dank für Ihren Auftrag!</p>
    <p>Bitte überweisen Sie den Gesamtbetrag bis zum ${invoice.dueDate ? formatDate(invoice.dueDate) : "angegebenen Datum"}.</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="Rechnung_${invoice.number}.html"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Serverfehler" }, { status: 500 });
  }
}
