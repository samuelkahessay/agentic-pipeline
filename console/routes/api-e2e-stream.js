function registerE2EStreamRoutes(app, { harness }) {
  app.get("/api/e2e/runs/:id/stream", (req, res) => {
    const run = harness.getRun(req.params.id);
    if (!run) {
      return res.status(404).json({ error: "Run not found" });
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    let lastEventId = parseLastEventId(req.headers["last-event-id"]);
    const writeFromStore = () => {
      const current = harness.getRun(req.params.id);
      if (!current) {
        return;
      }

      const nextEvents = (current.events || []).filter((event) => event.id > lastEventId);
      for (const event of nextEvents) {
        lastEventId = event.id;
        res.write(
          `id: ${event.id}\ndata: ${JSON.stringify({
            type: "event",
            run: current,
            event,
          })}\n\n`
        );
      }

      if (nextEvents.length === 0) {
        res.write(":keepalive\n\n");
      }
    };

    writeFromStore();
    const timer = setInterval(writeFromStore, 1_000);

    req.on("close", () => {
      clearInterval(timer);
      res.end();
    });
  });
}

function parseLastEventId(value) {
  if (Array.isArray(value)) {
    return parseLastEventId(value[0]);
  }
  return Number.parseInt(value || "0", 10) || 0;
}

module.exports = {
  registerE2EStreamRoutes,
};
