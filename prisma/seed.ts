import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.comment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.fileUpload.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.task.deleteMany();
  await prisma.intake.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminPassword = await bcrypt.hash("admin123", 10);
  const clientPassword = await bcrypt.hash("kunde123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@portal.de",
      name: "Martin (Admin)",
      password: adminPassword,
      role: "ADMIN",
      company: "Webdesign Freelancer",
    },
  });

  const client1 = await prisma.user.create({
    data: {
      email: "kunde@example.de",
      name: "Max Mustermann",
      password: clientPassword,
      role: "CLIENT",
      company: "Mustermann GmbH",
    },
  });

  const client2 = await prisma.user.create({
    data: {
      email: "anna@example.de",
      name: "Anna Schmidt",
      password: clientPassword,
      role: "CLIENT",
      company: "Schmidt Coaching",
    },
  });

  console.log("✅ Users created");

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      title: "Website Relaunch — Mustermann GmbH",
      description: "Kompletter Relaunch der Firmenwebsite mit neuem Design und CMS.",
      status: "DEVELOPMENT",
      priority: "HIGH",
      ownerId: client1.id,
      dueDate: new Date("2026-04-30"),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      title: "Landingpage — Schmidt Coaching",
      description: "Conversion-optimierte Landingpage für Online-Coaching.",
      status: "DESIGN",
      priority: "MEDIUM",
      ownerId: client2.id,
      dueDate: new Date("2026-04-15"),
    },
  });

  const project3 = await prisma.project.create({
    data: {
      title: "Online-Shop — Handmade Ceramics",
      description: "WooCommerce-Shop für handgefertigte Keramik.",
      status: "PLANNING",
      priority: "MEDIUM",
      ownerId: client1.id,
      dueDate: new Date("2026-05-31"),
    },
  });

  console.log("✅ Projects created");

  // Create tasks
  const tasks = [
    // Project 1
    { title: "Design-Konzept erstellen", status: "DONE", priority: "HIGH", projectId: project1.id },
    { title: "Startseite umsetzen", status: "DONE", priority: "HIGH", projectId: project1.id },
    { title: "Über Uns Seite", status: "IN_PROGRESS", priority: "MEDIUM", projectId: project1.id },
    { title: "Kontaktformular", status: "TODO", priority: "MEDIUM", projectId: project1.id },
    { title: "SEO-Optimierung", status: "TODO", priority: "LOW", projectId: project1.id },
    { title: "Launch & Testing", status: "TODO", priority: "HIGH", projectId: project1.id },
    // Project 2
    { title: "Zielgruppen-Analyse", status: "DONE", priority: "HIGH", projectId: project2.id },
    { title: "Wireframes erstellen", status: "IN_PROGRESS", priority: "HIGH", projectId: project2.id },
    { title: "Hero-Sektion designen", status: "TODO", priority: "HIGH", projectId: project2.id },
    { title: "CTA-Elemente", status: "TODO", priority: "MEDIUM", projectId: project2.id },
    // Project 3
    { title: "Anforderungen klären", status: "TODO", priority: "HIGH", projectId: project3.id },
    { title: "Produktkategorien definieren", status: "TODO", priority: "MEDIUM", projectId: project3.id },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("✅ Tasks created");

  // Create milestones
  await prisma.milestone.createMany({
    data: [
      { title: "Design freigegeben", completed: true, projectId: project1.id },
      { title: "Entwicklung abgeschlossen", completed: false, projectId: project1.id, dueDate: new Date("2026-04-15") },
      { title: "Live-Gang", completed: false, projectId: project1.id, dueDate: new Date("2026-04-30") },
      { title: "Design-Abnahme", completed: false, projectId: project2.id, dueDate: new Date("2026-04-05") },
    ],
  });

  console.log("✅ Milestones created");

  // Create messages
  await prisma.message.createMany({
    data: [
      {
        content: "Hallo Max! Ich habe das Design-Konzept fertig. Schau es dir bitte an und gib mir Feedback.",
        type: "UPDATE",
        projectId: project1.id,
        senderId: admin.id,
      },
      {
        content: "Sieht super aus! Die Farben gefallen mir sehr gut. Nur die Navigation könnte etwas größer sein.",
        type: "FEEDBACK",
        projectId: project1.id,
        senderId: client1.id,
      },
      {
        content: "Alles klar, ich passe die Navigation an. Ich melde mich wenn die Startseite steht.",
        type: "GENERAL",
        projectId: project1.id,
        senderId: admin.id,
      },
      {
        content: "Hallo Anna! Ich habe mit den Wireframes begonnen. Kannst du mir bitte die Texte für die Hero-Sektion schicken?",
        type: "UPDATE",
        projectId: project2.id,
        senderId: admin.id,
      },
      {
        content: "Klar! Ich schicke dir die Texte bis Freitag. Hier ist schon mal der Claim: 'Dein Körper. Dein Tempo. Dein Ergebnis.'",
        type: "GENERAL",
        projectId: project2.id,
        senderId: client2.id,
      },
    ],
  });

  console.log("✅ Messages created");

  // Create invoices
  let invoiceCounter = 1;
  const invoices = [
    { number: `RE-2026-${String(invoiceCounter++).padStart(3, "0")}`, title: "Anzahlung Website Relaunch", amount: 2495, status: "PAID", projectId: project1.id, clientId: client1.id, paidDate: new Date("2026-03-01") },
    { number: `RE-2026-${String(invoiceCounter++).padStart(3, "0")}`, title: "Zwischenzahlung Website", amount: 1497, status: "SENT", projectId: project1.id, clientId: client1.id, dueDate: new Date("2026-04-15") },
    { number: `RE-2026-${String(invoiceCounter++).padStart(3, "0")}`, title: "Anzahlung Landingpage", amount: 745, status: "SENT", projectId: project2.id, clientId: client2.id, dueDate: new Date("2026-04-01") },
  ];

  for (const invoice of invoices) {
    await prisma.invoice.create({ data: invoice });
  }

  console.log("✅ Invoices created");

  // Create intakes
  await prisma.intake.create({
    data: {
      projectId: project1.id,
      type: "BRANDING",
      data: JSON.stringify({
        companyName: "Mustermann GmbH",
        companyDescription: "Familienbetrieb seit 1998. Handwerk mit Herz.",
        brandColors: "#1a1a2e, #a3cf62",
        brandFonts: "Inter, Open Sans",
        targetAudience: "Hausbesitzer 30-60, München",
      }),
      status: "APPROVED",
    },
  });

  console.log("✅ Intakes created");
  console.log("\n🎉 Seeding complete!");
  console.log("\n📧 Login-Daten:");
  console.log("   Admin:  admin@portal.de / admin123");
  console.log("   Kunde:  kunde@example.de / kunde123");
  console.log("   Kunde:  anna@example.de / kunde123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
