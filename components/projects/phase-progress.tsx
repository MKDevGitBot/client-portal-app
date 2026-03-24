import { cn } from "@/lib/utils";

interface PhaseProgressProps {
  phases: {
    name: string;
    done: number;
    total: number;
  }[];
  currentPhase: string;
}

export default function PhaseProgressBar({ phases, currentPhase }: PhaseProgressProps) {
  const totalDone = phases.reduce((sum, p) => sum + p.done, 0);
  const totalTasks = phases.reduce((sum, p) => sum + p.total, 0);
  const overallPercent = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  const phaseLabels: Record<string, string> = {
    PLANNING: "Planung",
    DESIGN: "Design",
    DEVELOPMENT: "Entwicklung",
    REVIEW: "Review",
    LAUNCH: "Launch",
    COMPLETED: "Abgeschlossen",
  };

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-surface-500">
          <span>Gesamtfortschritt</span>
          <span>
            {totalDone}/{totalTasks} Aufgaben ({overallPercent}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-100">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${overallPercent}%` }}
          />
        </div>
      </div>

      {/* Phase breakdown */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {phases.map((phase) => {
          const isActive = phase.name === currentPhase;
          const percent = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0;
          const isComplete = phase.total > 0 && phase.done === phase.total;

          return (
            <div
              key={phase.name}
              className={cn(
                "rounded-lg border p-3 text-center",
                isActive
                  ? "border-primary-300 bg-primary-50"
                  : isComplete
                  ? "border-green-200 bg-green-50"
                  : "border-surface-200 bg-surface-50"
              )}
            >
              <p
                className={cn(
                  "text-xs font-medium truncate",
                  isActive
                    ? "text-primary-700"
                    : isComplete
                    ? "text-green-700"
                    : "text-surface-500"
                )}
              >
                {phaseLabels[phase.name] || phase.name}
              </p>
              <p className="mt-1 text-lg font-bold text-surface-900">
                {phase.done}/{phase.total}
              </p>
              {phase.total > 0 && (
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-200">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      isComplete ? "bg-green-500" : "bg-primary-400"
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
