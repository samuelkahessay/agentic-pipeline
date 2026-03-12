window.addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("history-table");
  if (!target) {
    return;
  }

  const response = await fetch("/api/history");
  const payload = await response.json();

  if (!payload.runs.length) {
    target.innerHTML = `<div class="history-row"><strong>No runs yet.</strong><small>Start one from the launch page.</small></div>`;
    return;
  }

  target.innerHTML = "";
  for (const run of payload.runs) {
    const row = document.createElement("article");
    row.className = "history-row";
    row.innerHTML = `
      <strong><a href="/run/${run.id}">${run.mode}</a></strong>
      <div>${run.summary || "No summary"}</div>
      <small>${run.status} · ${window.consoleApp.formatTime(run.createdAt)}</small>
    `;
    target.appendChild(row);
  }
});
