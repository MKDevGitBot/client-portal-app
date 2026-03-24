// First-run admin setup — only creates users if DB is empty
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log("ℹ️  Users exist, skipping admin setup");
    return;
  }

  console.log("🌱 First run — creating admin user...");

  const adminPw = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      email: "admin@portal.de",
      name: "Admin",
      password: adminPw,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created: admin@portal.de / admin123");
  console.log("⚠️  Passwort sofort ändern unter Einstellungen!");
}

main()
  .catch((e) => {
    console.error("Setup error:", e.message);
    process.exit(0); // Don't fail startup
  })
  .finally(() => prisma.$disconnect());
