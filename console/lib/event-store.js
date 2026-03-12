const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

function createEventStore() {
  const runs = new Map();

  function ensureRun(run) {
    if (!runs.has(run.id)) {
      runs.set(run.id, {
        ...run,
        events: [],
        emitter: new EventEmitter(),
      });
    }
    return runs.get(run.id);
  }

  return {
    createRun(run) {
      return ensureRun(run);
    },
    getRun(id) {
      return runs.get(id);
    },
    listRuns() {
      return Array.from(runs.values())
        .map(({ emitter, ...run }) => run)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    appendEvent(runId, event) {
      const run = runs.get(runId);
      if (!run) {
        return;
      }
      run.events.push(event);
      run.updatedAt = event.timestamp;
      run.emitter.emit("event", event);
    },
    subscribe(runId, listener) {
      const run = runs.get(runId);
      if (!run) {
        return null;
      }
      run.emitter.on("event", listener);
      return () => run.emitter.off("event", listener);
    },
    updateRun(runId, patch) {
      const run = runs.get(runId);
      if (!run) {
        return;
      }
      Object.assign(run, patch);
    },
  };
}

function ensureDataDir(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const keepFile = path.join(dataDir, ".gitkeep");
  if (!fs.existsSync(keepFile)) {
    fs.writeFileSync(keepFile, "");
  }
}

module.exports = {
  createEventStore,
  ensureDataDir,
};
