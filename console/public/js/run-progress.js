window.addEventListener("DOMContentLoaded", async () => {
  const runId = window.location.pathname.split("/").pop();
  const title = document.getElementById("run-title");
  const stageList = document.getElementById("stage-list");
  const eventLog = document.getElementById("event-log");

  const stages = new Map();

  function ensureStage(name) {
    if (stages.has(name)) {
      return stages.get(name);
    }
    const node = document.createElement("article");
    node.className = "stage-card";
    node.dataset.state = "idle";
    node.innerHTML = `<h3>${name}</h3><small>No events yet.</small>`;
    stageList.appendChild(node);
    stages.set(name, node);
    return node;
  }

  function appendLog(event) {
    const node = document.createElement("div");
    node.className = `event-log-entry ${event.data.level || ""}`.trim();
    node.innerHTML = `
      <strong>${event.stage}</strong>
      <div>${event.data.message || JSON.stringify(event.data)}</div>
      <small>${window.consoleApp.formatTime(event.timestamp)}</small>
    `;
    eventLog.prepend(node);
  }

  function applyEvent(event) {
    const stage = ensureStage(event.stage || "RUN");
    if (event.type === "stage_start") {
      stage.dataset.state = "active";
      stage.querySelector("small").textContent = event.data.label || "Running";
    } else if (event.type === "stage_complete" || event.type === "run_complete") {
      stage.dataset.state = "complete";
      stage.querySelector("small").textContent = "Complete";
    } else if (event.type === "stage_error" || event.type === "run_error") {
      stage.dataset.state = "error";
      stage.querySelector("small").textContent = `Failed (exit ${event.data.code})`;
    } else if (event.type === "progress") {
      stage.dataset.state = "active";
      stage.querySelector("small").textContent = event.data.message;
    } else if (event.type === "artifact") {
      stage.querySelector("small").textContent = `${event.data.key}: ${event.data.value}`;
    }

    appendLog(event);
  }

  const runResponse = await fetch(`/api/run/${runId}`);
  const run = await runResponse.json();
  title.textContent = `${run.mode} run · ${run.inputSource}`;
  for (const event of run.events || []) {
    applyEvent(event);
  }

  const source = new EventSource(`/api/run/${runId}/stream`);
  source.onmessage = (message) => {
    applyEvent(JSON.parse(message.data));
  };
});
