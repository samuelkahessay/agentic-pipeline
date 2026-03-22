const fs = require("fs");
const path = require("path");

const {
  resolveMarkdownReportDir,
  resolveReportDir,
} = require("./constants");

function createE2EReportWriter({ projectRoot }) {
  const jsonRoot = resolveReportDir(projectRoot);
  const markdownRoot = resolveMarkdownReportDir(projectRoot);

  return {
    write(run, snapshot) {
      fs.mkdirSync(jsonRoot, { recursive: true });
      fs.mkdirSync(markdownRoot, { recursive: true });

      const runDir = path.join(jsonRoot, run.id);
      fs.mkdirSync(runDir, { recursive: true });

      const reportJsonPath = path.join(runDir, "report.json");
      const stamp = (run.createdAt || new Date().toISOString()).slice(0, 10);
      const reportMarkdownPath = path.join(markdownRoot, `${stamp}-${run.id}.md`);

      const reportPayload = {
        run,
        snapshot,
      };

      fs.writeFileSync(reportJsonPath, JSON.stringify(reportPayload, null, 2) + "\n");
      fs.writeFileSync(reportMarkdownPath, renderMarkdown(run, snapshot));

      return {
        reportJsonPath,
        reportMarkdownPath,
        artifactRefs: buildArtifactRefs(reportJsonPath, reportMarkdownPath, snapshot),
      };
    },
  };
}

function buildArtifactRefs(reportJsonPath, reportMarkdownPath, snapshot) {
  const refs = [
    { type: "report_json", path: reportJsonPath },
    { type: "report_markdown", path: reportMarkdownPath },
  ];

  for (const run of snapshot.workflowRuns || []) {
    if (run.html_url) {
      refs.push({
        type: "workflow_run",
        label: run.name,
        url: run.html_url,
      });
    }
  }

  return refs;
}

function renderMarkdown(run, snapshot) {
  const lines = [
    `# E2E Run ${run.id}`,
    "",
    `- Lane: \`${run.lane}\``,
    `- Active lane: \`${run.activeLane || run.lane}\``,
    `- Status: \`${run.status}\``,
    `- Failure class: \`${run.failureClass || "none"}\``,
    `- Started: \`${run.startedAt || run.createdAt}\``,
    `- Finished: \`${run.finishedAt || "in_progress"}\``,
    `- Build session: \`${run.buildSessionId || "n/a"}\``,
    `- Repo: \`${run.repoFullName || "n/a"}\``,
    "",
    "## Summary",
    "",
    snapshot.summary || "No summary recorded.",
    "",
    "## Checks",
    "",
  ];

  const checks = [
    ["Root issue", run.rootIssueNumber ? `#${run.rootIssueNumber}` : "missing"],
    ["First PR", run.firstPrNumber ? `#${run.firstPrNumber}` : "missing"],
    ["Cleanup", `${run.cleanupStatus}${run.cleanupDetail ? ` — ${run.cleanupDetail}` : ""}`],
    [
      "PIPELINE_ACTIVE",
      snapshot.pipelineActive == null ? "unknown" : String(snapshot.pipelineActive),
    ],
  ];

  for (const [label, value] of checks) {
    lines.push(`- ${label}: ${value}`);
  }

  lines.push("", "## Timeline", "");
  for (const event of run.events || []) {
    lines.push(
      `- ${event.createdAt} · ${event.lane || run.lane} · ${event.step} · ${event.status}${event.detail ? ` · ${event.detail}` : ""}`
    );
  }

  lines.push("", "## GitHub Snapshot", "");
  lines.push(`- Labels: ${(snapshot.labels || []).map((label) => `\`${label}\``).join(", ") || "n/a"}`);
  lines.push(
    `- Secrets: ${(snapshot.secrets || []).map((secret) => `\`${secret}\``).join(", ") || "n/a"}`
  );
  lines.push(
    `- Variables: ${Object.entries(snapshot.variables || {})
      .map(([key, value]) => `\`${key}=${value}\``)
      .join(", ") || "n/a"}`
  );

  lines.push("", "## Issues", "");
  for (const issue of snapshot.issues || []) {
    lines.push(
      `- #${issue.number} ${issue.title} [${(issue.labels || []).join(", ") || "no-labels"}]`
    );
  }
  if (!snapshot.issues?.length) {
    lines.push("- none");
  }

  lines.push("", "## Pull Requests", "");
  for (const pr of snapshot.pullRequests || []) {
    lines.push(`- #${pr.number} ${pr.title} (${pr.state})`);
  }
  if (!snapshot.pullRequests?.length) {
    lines.push("- none");
  }

  lines.push("", "## Workflow Runs", "");
  for (const workflow of snapshot.workflowRuns || []) {
    lines.push(
      `- ${workflow.name} · ${workflow.status}${workflow.conclusion ? `/${workflow.conclusion}` : ""}${workflow.html_url ? ` · ${workflow.html_url}` : ""}`
    );
  }
  if (!snapshot.workflowRuns?.length) {
    lines.push("- none");
  }

  if (snapshot.errors?.length) {
    lines.push("", "## Errors", "");
    for (const error of snapshot.errors) {
      lines.push(`- ${error}`);
    }
  }

  return lines.join("\n") + "\n";
}

module.exports = {
  createE2EReportWriter,
};
