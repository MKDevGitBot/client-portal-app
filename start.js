// App startup — runs DB init then starts Next.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Client Portal...");

// Ensure data directory
const dataDir = "/app/data";
try { fs.mkdirSync(dataDir, { recursive: true }); } catch {}

// Remove stale SQLite locks
for (const ext of ["-journal", "-wal", "-shm"]) {
  try { fs.unlinkSync(path.join(dataDir, `prod.db${ext}`)); } catch {}
}

// Push schema
try {
  console.log("🔧 Syncing database...");
  execSync("npx prisma db push", { stdio: "inherit" });
} catch (e) {
  console.error("DB push failed:", e.message);
}

// Create admin if empty
try {
  console.log("👤 Checking admin...");
  execSync("node scripts/init-admin.js", { stdio: "inherit" });
} catch (e) {
  console.error("Admin init:", e.message);
}

console.log("✅ Starting Next.js...");

// Start Next.js
require("child_process").spawn("npx", ["next", "start", "-p", "3000"], {
  stdio: "inherit",
  env: process.env,
});
