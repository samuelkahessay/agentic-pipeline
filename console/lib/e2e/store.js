const crypto = require("crypto");

function createE2EStore(db) {
  return {
    createRun({
      lane,
      activeLane = "",
      status = "queued",
      cleanupMode = "keep",
      keepRepo = true,
      cookieJarPath = "",
      metadata = {},
    }) {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO e2e_runs (
           id, lane, active_lane, status, cleanup_mode, keep_repo, cookie_jar_path,
           metadata, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        lane,
        activeLane,
        status,
        cleanupMode,
        keepRepo ? 1 : 0,
        cookieJarPath,
        JSON.stringify(metadata || {}),
        now,
        now
      );
      return this.getRun(id);
    },

    getRun(id) {
      const row = db.prepare("SELECT * FROM e2e_runs WHERE id = ?").get(id);
      if (!row) {
        return null;
      }
      return {
        ...parseRunRow(row),
        events: this.getEvents(id),
      };
    },

    listRuns({ limit = 100 } = {}) {
      return db
        .prepare(
          `SELECT * FROM e2e_runs
           ORDER BY created_at DESC
           LIMIT ?`
        )
        .all(limit)
        .map(parseRunRow);
    },

    updateRun(id, fields) {
      const allowed = [
        "lane",
        "active_lane",
        "status",
        "failure_class",
        "failure_detail",
        "build_session_id",
        "repo_full_name",
        "repo_url",
        "root_issue_number",
        "root_issue_url",
        "first_pr_number",
        "first_pr_url",
        "cleanup_mode",
        "cleanup_status",
        "cleanup_detail",
        "keep_repo",
        "cookie_jar_path",
        "report_json_path",
        "report_markdown_path",
        "artifact_refs",
        "metadata",
        "started_at",
        "finished_at",
      ];

      const sets = [];
      const values = [];

      for (const [key, value] of Object.entries(fields || {})) {
        if (!allowed.includes(key)) {
          continue;
        }

        sets.push(`${key} = ?`);
        if (key === "artifact_refs" || key === "metadata") {
          values.push(JSON.stringify(value || (key === "artifact_refs" ? [] : {})));
        } else if (key === "keep_repo") {
          values.push(value ? 1 : 0);
        } else {
          values.push(value);
        }
      }

      if (sets.length === 0) {
        return this.getRun(id);
      }

      sets.push("updated_at = ?");
      values.push(new Date().toISOString());
      values.push(id);

      db.prepare(
        `UPDATE e2e_runs
         SET ${sets.join(", ")}
         WHERE id = ?`
      ).run(...values);

      return this.getRun(id);
    },

    appendEvent(runId, {
      lane = "",
      step,
      status,
      detail = "",
      evidence = {},
      elapsedMs = null,
    }) {
      const now = new Date().toISOString();
      const result = db.prepare(
        `INSERT INTO e2e_run_events (
           run_id, lane, step, status, detail, evidence, elapsed_ms, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        runId,
        lane,
        step,
        status,
        detail,
        JSON.stringify(evidence || {}),
        Number.isFinite(elapsedMs) ? elapsedMs : null,
        now
      );

      db.prepare(
        `UPDATE e2e_runs
         SET updated_at = ?
         WHERE id = ?`
      ).run(now, runId);

      return {
        id: result.lastInsertRowid,
        runId,
        lane,
        step,
        status,
        detail,
        evidence,
        elapsedMs: Number.isFinite(elapsedMs) ? elapsedMs : null,
        createdAt: now,
      };
    },

    getEvents(runId, { afterId = 0 } = {}) {
      return db
        .prepare(
          `SELECT * FROM e2e_run_events
           WHERE run_id = ? AND id > ?
           ORDER BY id ASC`
        )
        .all(runId, afterId)
        .map(parseEventRow);
    },
  };
}

function parseRunRow(row) {
  return {
    id: row.id,
    lane: row.lane,
    activeLane: row.active_lane,
    status: row.status,
    failureClass: row.failure_class || null,
    failureDetail: row.failure_detail || "",
    buildSessionId: row.build_session_id || null,
    repoFullName: row.repo_full_name || "",
    repoUrl: row.repo_url || "",
    rootIssueNumber: row.root_issue_number || null,
    rootIssueUrl: row.root_issue_url || "",
    firstPrNumber: row.first_pr_number || null,
    firstPrUrl: row.first_pr_url || "",
    cleanupMode: row.cleanup_mode,
    cleanupStatus: row.cleanup_status,
    cleanupDetail: row.cleanup_detail || "",
    keepRepo: Boolean(row.keep_repo),
    cookieJarPath: row.cookie_jar_path || "",
    reportJsonPath: row.report_json_path || "",
    reportMarkdownPath: row.report_markdown_path || "",
    artifactRefs: parseJson(row.artifact_refs, []),
    metadata: parseJson(row.metadata, {}),
    startedAt: row.started_at || null,
    finishedAt: row.finished_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseEventRow(row) {
  return {
    id: row.id,
    runId: row.run_id,
    lane: row.lane || "",
    step: row.step,
    status: row.status,
    detail: row.detail || "",
    evidence: parseJson(row.evidence, {}),
    elapsedMs: typeof row.elapsed_ms === "number" ? row.elapsed_ms : null,
    createdAt: row.created_at,
  };
}

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = { createE2EStore };
