# Client Portal — Coolify Deploy Guide

## Voraussetzungen

- GitHub-Repo: `MKDevGitBot/client-portal-app`
- Coolify-Instanz mit Docker
- Domain mit DNS (z.B. `client.mkdai.de`)

---

## Schritt 1: Neues Projekt in Coolify

1. **Coolify** → **Projects** → **+ New**
2. **Source** → **GitHub**
3. Repository: `MKDevGitBot/client-portal-app`
4. Branch: `main`

---

## Schritt 2: Build Pack

- **Build Pack:** `Nixpacks` (automatisch erkannt)

---

## Schritt 3: Domain einrichten

1. **Domains** → `https://client.mkdai.de`
2. DNS: CNAME `client.mkdai.de` → `deine-server-ip`
3. Coolify holt automatisch **Let's Encrypt SSL**

> ⚠️ **HTTPS ist Pflicht** — Cookies brauchen `secure: true` in Produktion.

---

## Schritt 4: Storage anlegen

| Typ | Host Path | Container Path |
|-----|-----------|----------------|
| **Docker Volume** | `/data/coolify/applications/APP_ID/db` | `/app/data` |

> Das Volume speichert die SQLite-Datenbank persistent.

---

## Schritt 5: Environment Variables

| Variable | Wert |
|----------|------|
| `DATABASE_URL` | `file:/app/data/prod.db` |
| `NODE_ENV` | `production` |
| `NEXTAUTH_URL` | `https://client.mkdai.de` |

---

## Schritt 6: Build & Start Commands

**Build Command:**
```
npm install && npx prisma generate && npm run build
```

**Start Command:**
```
npm run start:prod
```

> `start:prod` führt `start.sh` aus, das:
> - Lock-Dateien aufräumt
> - DB-Schema synced
> - Admin-User erstellt (falls erste Installation)
> - Next.js startet

**Port:** `3000`

---

## Schritt 7: Deploy

**Deploy** klicken. Fertig!

---

## Erster Login

Nach dem ersten Start wird automatisch ein Admin-User erstellt:

| Rolle | E-Mail | Passwort |
|-------|--------|----------|
| **Admin** | admin@portal.de | admin123 |

> ⚠️ **Sofort das Passwort ändern** unter **Einstellungen**!

---

## Was automatisch passiert

✅ DB wird erstellt/geupdated (`prisma db push`)
✅ Admin-User wird bei leerer DB angelegt
✅ Lock-Dateien werden aufgeräumt
✅ SSL wird von Let's Encrypt geholt
✅ Bei Code-Updates: Neuer Deploy → DB-Schema wird synced

**Kein SSH-Zugang nötig!**

---

## Seed-Demo-Daten (optional)

Falls du Demo-Projekte, Tasks und Rechnungen sehen willst:

1. SSH auf den Server
2. `docker exec -it CONTAINER_ID npx tsx prisma/seed.ts`

> ⚠️ **Achtung:** Das löscht alle existierenden Daten!

---

## Troubleshooting

| Problem | Lösung |
|---------|--------|
| Login funktioniert nicht | Prüfe ob HTTPS aktiv ist (Cookie `secure: true`) |
| DB fehler bei Deploy | Volume existiert? `/app/data` muss beschreibbar sein |
| Build schlägt fehl | `prisma generate` im Build Command? |
| Container startet nicht | Logs in Coolify prüfen |
