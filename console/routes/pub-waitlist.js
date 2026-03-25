function registerWaitlistRoutes(app, { db }) {
  // --- Public: join the waitlist ---

  app.post("/pub/waitlist", (req, res) => {
    const { email, github_username } = req.body || {};

    // Validate email
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Normalize GitHub username
    let normalizedGithub = null;
    if (github_username && typeof github_username === "string") {
      normalizedGithub = github_username.trim().replace(/^@/, "").toLowerCase();
      if (normalizedGithub === "") normalizedGithub = null;
    }

    // Insert (or ignore duplicate)
    try {
      db.prepare(
        `INSERT INTO waitlist (email, github_username) VALUES (?, ?)
         ON CONFLICT(email) DO NOTHING`
      ).run(trimmedEmail, normalizedGithub);
    } catch (err) {
      console.error("Waitlist insert error:", err);
      return res.status(500).json({ error: "Something went wrong" });
    }

    res.json({ ok: true });
  });

  // --- Operator: list waitlist signups ---

  app.get("/api/waitlist", (req, res) => {
    const rows = db
      .prepare("SELECT id, email, github_username, created_at, notes FROM waitlist ORDER BY created_at DESC")
      .all();

    if (req.query.format === "csv") {
      const header = "id,email,github_username,created_at,notes";
      const lines = rows.map(
        (r) =>
          `${r.id},"${r.email}","${r.github_username || ""}","${r.created_at}","${(r.notes || "").replace(/"/g, '""')}"`
      );
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=waitlist.csv");
      return res.send([header, ...lines].join("\n"));
    }

    res.json({ signups: rows, count: rows.length });
  });
}

module.exports = { registerWaitlistRoutes };
