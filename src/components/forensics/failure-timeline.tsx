import { failures } from "@/data/failures";
import type { FailureCategory } from "@/data/failures";

const CATEGORY_STYLES: Record<FailureCategory, { dot: string; badge: string; label: string }> = {
  workflow: {
    dot: "bg-red-500",
    badge: "bg-red-900 text-red-300",
    label: "workflow",
  },
  config: {
    dot: "bg-yellow-400",
    badge: "bg-yellow-900 text-yellow-300",
    label: "config",
  },
  api: {
    dot: "bg-blue-500",
    badge: "bg-blue-900 text-blue-300",
    label: "api",
  },
  "race-condition": {
    dot: "bg-purple-500",
    badge: "bg-purple-900 text-purple-300",
    label: "race-condition",
  },
};

function fmtTime(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

export function FailureTimeline() {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white mb-1">11 Fixes Applied During Run 1</h2>
      <p className="text-gray-400 mb-8 text-sm">Every failure made the pipeline more robust</p>

      <div className="relative border-l-2 border-gray-700 pl-8 flex flex-col gap-6">
        {failures.map((failure) => {
          const styles = CATEGORY_STYLES[failure.category];
          return (
            <div key={failure.id} className="relative">
              {/* Colored dot on the left border */}
              <span
                className={`absolute -left-[2.35rem] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-gray-950 ${styles.dot}`}
                aria-hidden="true"
              />

              <div className="bg-gray-800 rounded-lg p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <h3 className="text-white font-semibold">{failure.title}</h3>
                  <span className="text-gray-500 text-xs font-mono">{fmtTime(failure.timestamp)}</span>
                </div>

                <p className="text-gray-400 text-sm mb-1">
                  <span className="text-gray-300 font-medium">Root Cause: </span>
                  {failure.rootCause}
                </p>
                <p className="text-gray-400 text-sm mb-3">
                  <span className="text-gray-300 font-medium">Resolution: </span>
                  {failure.resolution}
                </p>

                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles.badge}`}>
                  {styles.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
