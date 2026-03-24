# Client Portal — Coolify Deployment Guide

## Schritt 1: Git Repository erstellen

```bash
cd /data/client-portal-app

# Git initialisieren
git init
git add .
git commit -m "Initial commit — Client Portal App"

# Remote hinzufügen (dein Git-Host)
git remote add origin git@github.com:DEIN-USER/client-portal-app.git
git push -u origin main
```

**Wichtig:** Stelle sicher, dass `.env` NICHT committed wird.
Prüfe ob `.gitignore` existiert — falls nicht, erstelle eine:

```bash
cat > .gitignore << 'EOF'
node_modules
.next
.env
prisma/dev.db
public/uploads/*
!public/uploads/.gitkeep
EOF
```

---

## Schritt 2: Coolify — Neues Projekt anlegen

1. **Coolify Dashboard** öffnen
2. **"+ New Resource"** → **"Application"**
3. **Source:** Git Repository
4. **Repository-URL** einfügen
5. **Branch:** `main`
6. **Build Pack:** Nixpacks (automatisch)

---

## Schritt 3: Environment Variables setzen

In Coolify → dein Projekt → **Environment Variables**:

```
DATABASE_URL=file:./prod.db
NEXTAUTH_URL=https://dein-client-portal.de
NEXTAUTH_SECRET=ein-langer-zufaelliger-string-mindestens-32-zeichen
NODE_ENV=production
```

**NEXTAUTH_SECRET generieren:**
```bash
openssl rand -base64 32
```

---

## Schritt 4: Build Command anpassen

In Coolify → **Build Configuration**:

```bash
npm install && npx prisma generate && npx prisma db push && npm run build
```

**Start Command:**
```bash
npm start
```

**Port:** 3000

---

## Schritt 5: Persistent Storage (wichtig!)

SQLite braucht persistenten Speicher. Ohne das geht die DB bei jedem Deploy verloren.

In Coolify → **Storages**:

| Host Path | Container Path |
|-----------|---------------|
| `/data/coolify/client-portal/db` | `/app/prisma` |
| `/data/coolify/client-portal/uploads` | `/app/public/uploads` |

Alternativ: Volume Mount

```yaml
# docker-compose.override.yml (falls nötig)
volumes:
  - /data/coolify/client-portal/db:/app/prisma
  - /data/coolify/client-portal/uploads:/app/public/uploads
```

---

## Schritt 6: Deployen

1. **"Deploy"** Button klicken
2. Warten bis Build fertig ist
3. Domain öffnen

---

## Schritt 7: Erste Benutzer anlegen

Nach dem ersten Deploy gibt es noch keine User. Du musst das Seed-Script ausführen.

### Option A: SSH + Docker Exec

```bash
# Container-Name finden
docker ps | grep client-portal

# Seed ausführen
docker exec -it CONTAINER_NAME npx tsx prisma/seed.ts
```

### Option B: Admin-User manuell per API

Wenn du keinen SSH-Zugang hast, erstelle einen temporären Setup-Endpoint.

Erstelle diese Datei lokal, pushe sie, und rufe sie einmal auf:

**Datei: `/app/api/setup/route.ts`**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET() {
  // Nur beim ersten Mal ausführen
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return NextResponse.json({ error: "Setup already done" }, { status: 400 });
  }

  const admin = await prisma.user.create({
    data: {
      email: "admin@deine-domain.de",
      name: "Admin",
      password: await hashPassword("DEIN-PASSWORT"),
      role: "ADMIN",
      company: "Dein Unternehmen",
    },
  });

  return NextResponse.json({ 
    message: "Admin erstellt", 
    email: admin.email 
  });
}
```

**Aufrufen:** `https://dein-client-portal.de/api/setup`

**⚠️ WICHTIG:** Diese Datei nach dem Setup SOFORT löschen und neu deployen!

---

## Schritt 8: Domain & SSL

1. In Coolify → **Domains** → deine Domain eintragen
2. SSL wird automatisch via Let's Encrypt eingerichtet
3. DNS: A-Record auf Coolify-Server IP

---

## Benutzer verwalten

### Neuen Admin anlegen

Per Prisma Studio (SSH nötig):

```bash
docker exec -it CONTAINER_NAME npx prisma studio
# Browser öffnet sich → User erstellen mit role: "ADMIN"
```

### Neuen Kunden anlegen

Gleich wie Admin, aber mit `role: "CLIENT"`.

### Passwort ändern

Per Prisma Studio oder direkt in der DB:

```bash
# Neues Passwort hashen
node -e "require('bcryptjs').hash('NEUES-PASSWORT', 10).then(console.log)"

# Hash in DB setzen (per Prisma Studio oder SQL)
```

---

## Troubleshooting

### Build schlägt fehl → "Cannot find module tailwindcss"
- NODE_ENV ist auf production → devDependencies werden nicht installiert
- Fix: Build Command mit `NODE_ENV=development npm install` starten

### DB nach Deploy leer
- Persistent Storage nicht konfiguriert
- Siehe Schritt 5

### Auth funktioniert nicht
- NEXTAUTH_URL muss exakt zur Domain stimmen (inkl. https://)
- NEXTAUTH_SECRET muss gesetzt sein

### Uploads verschwinden nach Deploy
- Persistent Storage für `/app/public/uploads` fehlt
- Siehe Schritt 5

---

## Quick Reference

| Was | Wert |
|-----|------|
| Framework | Next.js 14 |
| DB | SQLite (prisma/prod.db) |
| Port | 3000 |
| Build | `npm install && npx prisma generate && npx prisma db push && npm run build` |
| Start | `npm start` |
| Admin Login | admin@portal.de / admin123 |
