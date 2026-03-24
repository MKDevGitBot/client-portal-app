import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

// ⚠️ TEMPORÄRER ENDPOINT — Nach Setup SOFORT löschen!
// Aufruf: GET /api/setup
export async function GET() {
  try {
    // Nur beim ersten Mal ausführen
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: "Setup bereits durchgeführt. Bitte diesen Endpoint löschen." },
        { status: 400 }
      );
    }

    // Admin erstellen
    const admin = await prisma.user.create({
      data: {
        email: "admin@portal.de",
        name: "Admin",
        password: await hashPassword("admin123"),
        role: "ADMIN",
        company: "Mein Unternehmen",
      },
    });

    // Demo-Kunde erstellen
    const client = await prisma.user.create({
      data: {
        email: "kunde@example.de",
        name: "Max Mustermann",
        password: await hashPassword("kunde123"),
        role: "CLIENT",
        company: "Mustermann GmbH",
      },
    });

    // Demo-Projekt erstellen
    const project = await prisma.project.create({
      data: {
        title: "Website Relaunch — Demo",
        description: "Demo-Projekt zum Testen des Portals.",
        status: "DESIGN",
        priority: "HIGH",
        ownerId: client.id,
      },
    });

    // Demo-Tasks
    await prisma.task.createMany({
      data: [
        { title: "Design-Konzept", status: "DONE", priority: "HIGH", projectId: project.id },
        { title: "Startseite umsetzen", status: "IN_PROGRESS", priority: "HIGH", projectId: project.id },
        { title: "SEO-Optimierung", status: "TODO", priority: "MEDIUM", projectId: project.id },
      ],
    });

    // Demo-Rechnung
    await prisma.invoice.create({
      data: {
        number: "RE-2026-001",
        title: "Anzahlung Website",
        amount: 2495,
        status: "SENT",
        projectId: project.id,
        clientId: client.id,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Setup abgeschlossen! Login-Daten:",
      admin: { email: admin.email, password: "admin123" },
      client: { email: client.email, password: "kunde123" },
      warning: "BITTE DIESEN ENDPOINT JETZT LÖSCHEN!",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Setup fehlgeschlagen", details: String(error) },
      { status: 500 }
    );
  }
}
