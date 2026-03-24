# Client Portal V2 — Code Audit Report

**Date:** 2026-03-24
**Auditor:** Automated Senior Code Audit
**Stack:** Next.js 14 + Prisma + SQLite + Tailwind CSS

---

## 1. BUILD CHECK

| Check | Status | Details |
|-------|--------|---------|
| TypeScript compilation (`tsc --noEmit`) | ✅ | Zero errors |
| Prisma schema generation | ✅ | Generated successfully (v5.22.0) |
| `next build` feasibility | ✅ | No obvious blockers (CSS uses tailwind, imports resolve, no circular deps in page code) |

---

## 2. SCHEMA AUDIT

| Check | Status | Details |
|-------|--------|---------|
| All models defined | ✅ | 11 models: User, Project, Task, Milestone, Message, MessageRead, Comment, Invoice, FileUpload, FileComment, Intake, Session, ActivityLog |
| Relations correct | ⚠️ | See issue below |
| Cascade deletes | ⚠️ | See issue below |
| `@@map` on all models | ✅ | All tables have snake_case mapping |
| Composite unique on MessageRead | ✅ | `@@unique([messageId, userId])` prevents double-read |

### Issues Found

**❌ `User` — Missing cascade deletes on relations**
- `lib/auth.ts:43` — `prisma.user.delete` in `DELETE /api/admin/users/[id]` will **fail** because:
  - `Message.senderId` → User (no `onDelete`)
  - `Invoice.clientId` → User (no `onDelete`)
  - `FileUpload.uploaderId` → User (no `onDelete`)
  - `Session.userId` → User (no `onDelete`)
  - `ActivityLog.userId` → User (no `onDelete`)
- **Fix:** Add `onDelete: Cascade` to these relations in `schema.prisma`, OR add a pre-delete cleanup in the API route that reassigns/deletes dependent records. Recommended: add cascade to Session, ActivityLog; restrict delete for Message/Invoice/FileUpload with proper cleanup in the API.

---

## 3. API ROUTES AUDIT

### 3.1 Auth Routes

| Route | Auth | Issues |
|-------|------|--------|
| `POST /api/auth/login` | ✅ Public (correct) | Rate limiter in-memory (see Security §4) |
| `POST /api/auth/logout` | ❌ No auth check | `app/api/auth/logout/route.ts:4` — calls `destroySession()` without verifying user. Acceptable for logout, but no activity logging. |
| `POST /api/auth/logout-all` | ✅ `getCurrentUser()` | — |
| `GET /api/auth/me` | ✅ `getCurrentUser()` | — |
| `POST /api/auth/password` | ✅ `getCurrentUser()` | No minimum complexity enforcement server-side (just length ≥ 6) |
| `GET/DELETE /api/auth/sessions` | ✅ `getCurrentUser()` | — |

### 3.2 Admin Routes

| Route | Auth | Issues |
|-------|------|--------|
| `GET /api/admin/activity` | ✅ Admin check | — |
| `GET/POST /api/admin/users` | ✅ Admin check | — |
| `PUT /api/admin/users/[id]` | ✅ Admin check | — |
| `DELETE /api/admin/users/[id]` | ✅ Admin check | ⚠️ Will fail due to missing cascade (see §2) |
| `POST /api/projects/[id]/archive` | ✅ `requireAdmin()` | — |
| `POST /api/projects/[id]/template` | ✅ `requireAdmin()` | — |

### 3.3 Public/Client Routes

| Route | Auth | Issues |
|-------|------|--------|
| `GET /api/search` | ✅ `getCurrentUser()` | No SQL injection risk (Prisma parameterized) |
| `GET/POST /api/messages` | ✅ Auth checks | — |
| `POST /api/messages/read` | ✅ `requireAuth()` | — |
| `GET /api/messages/stream` | ✅ `getCurrentUser()` | ⚠️ SSE leak (see §4) |
| `POST /api/files` | ✅ `requireAuth()` | ⚠️ No file validation (see §4) |
| `GET/POST /api/files/[id]/comments` | ✅ `requireAuth()` | No access check on file — any authenticated user can comment on any file |
| `POST /api/intake` | ✅ `requireAuth()` | — |
| `GET /api/invoices/[id]/pdf` | ✅ `requireAuth()` | ⚠️ HTML injection (see §4) |

### 3.4 Setup Route

**❌ CRITICAL — `GET /api/setup` is a public security hole**
- `app/api/setup/route.ts` — Creates admin user with hardcoded password `admin123`, returns credentials in plaintext JSON response.
- Only guard is checking `userCount > 0` — if database is wiped, this is exploitable.
- The comment says "TEMPORARY" but it's in the codebase.
- **Fix:** DELETE this file entirely before deploying.

---

## 4. SECURITY AUDIT

### Critical Issues

**❌ Hardcoded demo credentials on login page**
- `components/ui/login-form.tsx:103-109` — Displays `admin@portal.de / admin123` and `kunde@example.de / kunde123` directly in the UI.
- **Fix:** Remove the demo credentials box from the login form for production.

**❌ `/api/setup` endpoint exposed**
- See §3.4 above.

### High Issues

**⚠️ No file upload validation**
- `app/api/files/route.ts:18-33` — No file type validation, no size limit, user-controlled filename used directly.
- `const filename = \`${Date.now()}-${file.name}\`` — `file.name` can contain path traversal characters (`../`) on some OS/configurations.
- No virus scanning or MIME validation beyond trusting `file.type`.
- **Fix:** Validate file extension against allowlist, sanitize filename, add size limit (e.g., 10MB), use `path.basename()`.

**⚠️ Rate limiter is in-memory**
- `app/api/auth/login/route.ts:7-9` — `loginAttempts` Map is module-level. In serverless/multi-instance deployments, rate limiting is per-instance only and resets on cold start.
- **Fix:** Use Redis or database-backed rate limiting for production.

### Medium Issues

**⚠️ SSE connections accumulate without cleanup**
- `app/api/messages/stream/route.ts:6` — Module-level `clients` Map grows unboundedly. The `AbortController` is created but never connected to the request (the `signal` is never passed to the Response, and there's no request abort handler).
- **Fix:** Connect the abort signal to the request lifecycle, or implement periodic cleanup of stale controllers.

**⚠️ Invoice PDF has HTML injection**
- `app/api/invoices/[id]/pdf/route.ts` — Invoice title, description, client name, company name are interpolated directly into HTML without escaping: `` <strong>${invoice.title}</strong> ``, `` ${invoice.client.name} ``, `` ${invoice.client.company} ``.
- A malicious client name like `<script>alert('xss')</script>` would execute.
- **Fix:** HTML-escape all user-controlled values before interpolation.

**⚠️ No input validation with Zod**
- `zod` is listed in `package.json` dependencies but is **never imported or used** anywhere in the codebase. All API routes use manual `if (!field)` checks.
- **Fix:** Either implement Zod schemas for API input validation, or remove the dependency.

**⚠️ File comments — no project access check**
- `app/api/files/[id]/comments/route.ts:17` — GET comments doesn't verify the requesting user has access to the file's project. Any authenticated user can read/write comments on any file.
- **Fix:** Add project access check: verify `file.uploaderId === user.id || user.role === "ADMIN" || file.project?.ownerId === user.id`.

### Low Issues

**⚠️ Logout doesn't log activity**
- `app/api/auth/logout/route.ts` — Calls `destroySession()` but doesn't call `logActivity()` (unlike login which does).

**⚠️ NEXTAUTH_SECRET is a placeholder**
- `.env:3` — `NEXTAUTH_SECRET="your-secret-key-change-in-production"` — this is not actually used (app uses custom session management), but still a bad practice.

**⚠️ `next-auth` unused dependency**
- Listed in `package.json` but never imported. Custom auth is implemented instead.
- **Fix:** Remove `next-auth` from dependencies.

---

## 5. UI/COMPONENT AUDIT

| Check | Status | Details |
|-------|--------|---------|
| `"use client"` directives | ✅ | All client components have the directive |
| Dark mode classes | ✅ | Consistently applied across all components |
| `console.log` in app code | ✅ | Only in `prisma/seed.ts` (acceptable) |
| CSS component classes | ✅ | `.btn-primary`, `.card`, `.input`, `.badge` all defined in `globals.css` |
| Tailwind config | ✅ | Custom `surface` and `primary` colors, `darkMode: "class"` |

### Issues Found

**⚠️ `MessageComposer` component is unused**
- `components/messages/message-composer.tsx` — Exports a `MessageComposer` component but it's never imported anywhere. The messages page has its own inline composer in `messages-client.tsx`.
- **Fix:** Remove dead code.

**⚠️ Intake form missing dark mode on several labels**
- `components/ui/intake-form.tsx` — Some `<label>` elements use `text-surface-700` without `dark:text-surface-300` counterpart (e.g., lines for "Projekt", "Art der Einreichung", "Firmenname", etc.).
- **Fix:** Add `dark:text-surface-300` to all label elements.

**⚠️ Intake form heading missing dark mode**
- `components/ui/intake-form.tsx:44` — `<h3>` uses `text-surface-900` without `dark:text-surface-100`.

**⚠️ Project detail page missing dark mode on header**
- `app/(app)/projects/[id]/page.tsx:73` — `<h1>` uses `text-surface-900` without dark variant.

**⚠️ Next.js 14 `params` should be awaited**
- Several pages access `params` synchronously: `projects/[id]/page.tsx`, `projects/[id]/timeline/page.tsx`, `invoices/[id]/page.tsx`, `admin/users/[id]/page.tsx`, `files/[id]/comments/route.ts`, `invoices/[id]/pdf/route.ts`, `projects/[id]/archive/route.ts`, `projects/[id]/template/route.ts`, `admin/users/[id]/route.ts`.
- In Next.js 14, `params` is a plain object (not a Promise), so this works. But Next.js 15 makes `params` a Promise — this code will break on upgrade.
- **Fix:** Not urgent, but document for future migration.

---

## 6. DATA INTEGRITY AUDIT

| Check | Status | Details |
|-------|--------|---------|
| Proper `includes`/`selects` | ✅ | API routes use `select` to limit returned fields, avoiding password leakage |
| N+1 query issues | ⚠️ | See below |
| `onDelete: Cascade` | ⚠️ | Partially set (see §2) |
| Null checks | ✅ | Most queries check for null results |

### Issues Found

**⚠️ Dashboard page — potential N+1**
- `app/(app)/dashboard/page.tsx:21-46` — Loads all projects with `include: { owner: true, tasks: true }`. If there are many projects, this loads ALL tasks for ALL projects. For a client portal with few projects this is fine, but doesn't scale.
- **Fix:** Use `_count: { select: { tasks: true } }` and aggregate task statuses separately if needed at scale.

**⚠️ Sessions route exposes token hash**
- `app/api/auth/sessions/route.ts:16-20` — `select: { token: true }` returns the session token. While this isn't the password, exposing tokens to the frontend is unnecessary.
- **Fix:** Remove `token` from the select clause — only `id`, `createdAt`, `expiresAt` are needed.

**⚠️ `next.config.js` uses deprecated `experimental.serverComponentsExternalPackages`**
- Renamed to `serverExternalPackages` in newer Next.js.
- **Fix:** Update to `serverExternalPackages: ["@prisma/client"]`.

---

## 7. MIGRATION CHECK

Since this is a greenfield project (no "original" to compare against), here are the models and what's needed for deployment:

### Models in Schema (13 total)
1. `User` → `users`
2. `Project` → `projects`
3. `Task` → `tasks`
4. `Milestone` → `milestones`
5. `Message` → `messages`
6. `MessageRead` → `message_reads`
7. `Comment` → `comments`
8. `Invoice` → `invoices`
9. `FileUpload` → `file_uploads`
10. `FileComment` → `file_comments`
11. `Intake` → `intakes`
12. `Session` → `sessions`
13. `ActivityLog` → `activity_logs`

### Deployment Steps
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Create/migrate database
npx prisma db push    # SQLite — creates tables from schema

# 4. Seed initial data (optional)
npx tsx prisma/seed.ts

# 5. Build
npm run build

# 6. Start
npm start
```

**Note:** SQLite `prisma db push` doesn't create migration files. For production with proper migrations, switch to `npx prisma migrate dev` and commit the `prisma/migrations/` directory.

### Important: Schema Changes Needed Before Deploy
If the cascade delete fix (§2) is applied, run `npx prisma db push` again after modifying `schema.prisma`.

---

## SUMMARY

### Critical (Must Fix Before Deploy)
| # | Issue | File |
|---|-------|------|
| 1 | ❌ `/api/setup` endpoint creates admin with hardcoded password | `app/api/setup/route.ts` |
| 2 | ❌ Demo credentials displayed on login page | `components/ui/login-form.tsx:103-109` |
| 3 | ❌ User deletion will crash (FK constraint violations) | `app/api/admin/users/[id]/route.ts` + `prisma/schema.prisma` |

### High Priority
| # | Issue | File |
|---|-------|------|
| 4 | ⚠️ No file upload validation (type, size, filename sanitization) | `app/api/files/route.ts` |
| 5 | ⚠️ HTML injection in invoice PDF | `app/api/invoices/[id]/pdf/route.ts` |
| 6 | ⚠️ SSE connections leak (AbortController not wired) | `app/api/messages/stream/route.ts` |

### Medium Priority
| # | Issue | File |
|---|-------|------|
| 7 | ⚠️ In-memory rate limiter (doesn't work in serverless) | `app/api/auth/login/route.ts` |
| 8 | ⚠️ File comments lack project access check | `app/api/files/[id]/comments/route.ts` |
| 9 | ⚠️ Session token exposed in API response | `app/api/auth/sessions/route.ts` |
| 10 | ⚠️ Intake form missing dark mode classes | `components/ui/intake-form.tsx` |

### Low Priority / Cleanup
| # | Issue | File |
|---|-------|------|
| 11 | ⚠️ Unused dependencies: `next-auth`, `zod`, `date-fns` | `package.json` |
| 12 | ⚠️ Unused `MessageComposer` component | `components/messages/message-composer.tsx` |
| 13 | ⚠️ Logout doesn't log activity | `app/api/auth/logout/route.ts` |
| 14 | ⚠️ Deprecated `experimental.serverComponentsExternalPackages` | `next.config.js` |
| 15 | ⚠️ Several pages missing dark mode on headings | Various |

### Passing Checks
- ✅ TypeScript compiles with zero errors
- ✅ Prisma schema generates successfully
- ✅ All server components properly use `getCurrentUser()`/`requireAuth()`
- ✅ All admin routes check `role === "ADMIN"`
- ✅ No password fields leaked in API responses (proper `select` usage)
- ✅ Login uses bcrypt with salt rounds 10
- ✅ Sessions use cryptographically random tokens (32 bytes)
- ✅ HTTP-only, secure cookies for sessions
- ✅ Rate limiting on login endpoint
- ✅ Proper error handling (try/catch) in all API routes
- ✅ Dark mode consistently applied across most components
- ✅ No `console.log` in production code
- ✅ Prisma queries use parameterized queries (no SQL injection risk)
- ✅ `@@map` on all models for clean table names
- ✅ Proper cascade deletes on Task, Milestone, Message, MessageRead, FileComment, Intake

---

**Overall Assessment:** The codebase is well-structured with good patterns (custom auth, Prisma, Tailwind dark mode). However, **3 critical security issues** must be resolved before any production deployment. The cascade delete bug will cause runtime errors when deleting users. The setup endpoint and demo credentials are unacceptable in production.
