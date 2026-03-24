# Client Portal App

Modernes SaaS Web-Portal für Freelancer/Webdesigner zur Verwaltung von Kundenprojekten.

## Features

- **Dashboard** — Übersicht über Projekte, Aufgaben, Rechnungen und Nachrichten
- **Projekte** — Phasen-basiertes Tracking (Planung → Design → Entwicklung → Review → Launch)
- **Daten einreichen** — Strukturierte Intake-Formulare für Branding, Inhalte und Kontakt
- **Rechnungen** — Rechnungsverwaltung mit Status-Tracking
- **Nachrichten** — Kommunikation zwischen Freelancer und Kunde
- **Datei-Uploads** — Dateien hochladen und verwalten

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Datenbank:** SQLite + Prisma ORM
- **Auth:** Session-basiert (einfach, sicher)
- **Icons:** Lucide React

## Schnellstart

```bash
# Alles auf einmal
npm run setup

# Oder Schritt für Schritt:
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Die App läuft dann auf **http://localhost:3000**.

## Demo-Zugänge

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| Admin | admin@portal.de | admin123 |
| Kunde | kunde@example.de | kunde123 |
| Kunde | anna@example.de | kunde123 |

## Projektstruktur

```
client-portal-app/
├── app/
│   ├── (app)/           # Authenticated pages
│   │   ├── dashboard/   # Dashboard overview
│   │   ├── projects/    # Project list & detail
│   │   ├── intake/      # Data submission forms
│   │   ├── invoices/    # Invoice management
│   │   └── messages/    # Communication
│   ├── api/
│   │   ├── auth/        # Login/Logout
│   │   ├── intake/      # Form submissions
│   │   ├── messages/    # Message API
│   │   └── files/       # File uploads
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/          # Sidebar, navigation
│   ├── dashboard/       # Stats, recent activity
│   ├── messages/        # Message composer
│   └── ui/              # Forms, shared components
├── lib/
│   ├── prisma.ts        # Database client
│   ├── auth.ts          # Authentication helpers
│   └── utils.ts         # Utility functions
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Demo data
├── .env                 # Environment variables
├── package.json
└── README.md
```

## Datenbank

SQLite-Datei wird automatisch unter `prisma/dev.db` erstellt.

### Modelle

- **User** — Admin + Client Rollen
- **Project** — Mit Status-Phasen und Priorität
- **Task** — Aufgaben mit Status und Zuweisung
- **Milestone** — Projekt-Meilensteine
- **Message** — Kommunikation pro Projekt
- **Invoice** — Rechnungen mit Status
- **FileUpload** — Datei-Management
- **Intake** — Strukturierte Daten-Einreichungen
- **Session** — Auth-Sessions

## Deployment

### Vercel
```bash
# SQLite funktioniert nicht auf Vercel (Serverless).
# Für Production: PostgreSQL oder PlanetScale verwenden.
```

### Eigener Server
```bash
npm run build
npm start
```

## Customization

### Admin hinzufügen
```bash
npx prisma studio
# → User erstellen mit role: "ADMIN"
```

### Branding anpassen
- Farben: `tailwind.config.ts` → `theme.extend.colors`
- Logo: `components/layout/sidebar.tsx`
- Name: `app/layout.tsx` → `metadata.title`

## Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run dev` | Development-Server starten |
| `npm run build` | Production-Build |
| `npm run db:push` | Schema auf DB anwenden |
| `npm run db:seed` | Demo-Daten erstellen |
| `npm run db:studio` | Prisma Studio öffnen |
| `npm run setup` | Alles auf einmal |

## Lizenz

MIT
