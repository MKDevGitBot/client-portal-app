import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IntakeForm } from "@/components/ui/intake-form";

export default async function IntakePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isAdmin = user.role === "ADMIN";
  const where = isAdmin ? {} : { ownerId: user.id };

  const projects = await prisma.project.findMany({
    where,
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: "desc" },
  });

  const intakes = await prisma.intake.findMany({
    where: isAdmin ? {} : { project: { ownerId: user.id } },
    include: { project: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Daten einreichen</h1>
        <p className="mt-1 text-surface-500">
          Reiche Inhalte, Texte und Dateien für dein Projekt ein.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form */}
        <div>
          <IntakeForm projects={projects} />
        </div>

        {/* Previous Submissions */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-surface-900">
            Eingereichte Daten
          </h3>
          <div className="space-y-3">
            {intakes.length === 0 ? (
              <p className="py-8 text-center text-surface-400">
                Noch keine Daten eingereicht
              </p>
            ) : (
              intakes.map((intake) => (
                <div
                  key={intake.id}
                  className="rounded-lg border border-surface-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-surface-900">
                      {intake.type}
                    </span>
                    <span
                      className={`badge ${
                        intake.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : intake.status === "REVIEWED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {intake.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-surface-500">
                    Projekt: {intake.project.title}
                  </p>
                  <p className="mt-0.5 text-xs text-surface-400">
                    {new Date(intake.createdAt).toLocaleDateString("de-DE")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
