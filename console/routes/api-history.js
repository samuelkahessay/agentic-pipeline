function registerHistoryRoutes(app, { eventStore }) {
  app.get("/api/history", (_req, res) => {
    res.json({ runs: eventStore.listRuns() });
  });
}

module.exports = {
  registerHistoryRoutes,
};
