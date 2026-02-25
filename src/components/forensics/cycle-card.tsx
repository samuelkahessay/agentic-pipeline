import type { PipelinePR, PipelineIssue } from "@/data/types";

interface CycleGroup {
  cycleNumber: number;
  startTime: string;
  endTime: string;
  prs: PipelinePR[];
  issuesAvailable: number;
  linesChanged: number;
}

/** Groups PRs into repo-assist cycles: PRs within 5 min of each other = same cycle. */
export function groupIntoCycles(
  prs: PipelinePR[],
  issues: PipelineIssue[]
): CycleGroup[] {
  if (prs.length === 0) return [];

  const sorted = [...prs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const groups: PipelinePR[][] = [[sorted[0]]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const gap =
      new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
    if (gap <= 5 * 60 * 1000) {
      groups[groups.length - 1].push(curr);
    } else {
      groups.push([curr]);
    }
  }

  return groups.map((group, i) => {
    const startTime = group[0].createdAt;
    const endTime = group[group.length - 1].createdAt;
    const t = new Date(startTime).getTime();

    // Count issues where createdAt <= t and (closedAt is null or closedAt > t) and has "pipeline" label
    const issuesAvailable = issues.filter((issue) => {
      const created = new Date(issue.createdAt).getTime();
      const closed = issue.closedAt ? new Date(issue.closedAt).getTime() : null;
      const hasPipeline = issue.labels.some((l) => l.name === "pipeline");
      return hasPipeline && created <= t && (closed === null || closed > t);
    }).length;

    const linesChanged = group.reduce(
      (sum, pr) => sum + pr.additions + pr.deletions,
      0
    );

    return {
      cycleNumber: i + 1,
      startTime,
      endTime,
      prs: group,
      issuesAvailable,
      linesChanged,
    };
  });
}

function fmtTime(ts: string): string {
  const d = new Date(ts);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

interface CycleCardProps {
  cycle: CycleGroup;
  index: number;
}

export function CycleCard({ cycle, index }: CycleCardProps) {
  const bg = index % 2 === 0 ? "bg-gray-800" : "bg-gray-900";
  return (
    <div className={`${bg} rounded-xl p-6 border border-gray-700`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-lg">
          Cycle #{cycle.cycleNumber}
        </h3>
        <span className="text-gray-400 text-sm font-mono">
          {fmtTime(cycle.startTime)}
          {cycle.startTime !== cycle.endTime &&
            ` – ${fmtTime(cycle.endTime)}`}{" "}
          UTC
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">
            {cycle.issuesAvailable}
          </div>
          <div className="text-gray-400 text-xs mt-1">Issues Available</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-400">
            {cycle.prs.length}
          </div>
          <div className="text-gray-400 text-xs mt-1">PRs Created</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {cycle.linesChanged.toLocaleString()}
          </div>
          <div className="text-gray-400 text-xs mt-1">Lines Changed</div>
        </div>
      </div>
      <ul className="space-y-1">
        {cycle.prs.map((pr) => (
          <li key={pr.number} className="text-sm text-gray-300">
            <span className="text-gray-500 font-mono mr-2">#{pr.number}</span>
            {pr.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
