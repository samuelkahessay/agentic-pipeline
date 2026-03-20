import styles from "./what-you-get.module.css";

const DELIVERABLES = [
  {
    title: "A real repo",
    body: "Your own GitHub repository with clean commit history, PR-reviewed code, and full version control. Not locked in a platform.",
  },
  {
    title: "An inspectable beta run",
    body: "The public build page records the entitlement gate, BYOK gate, provisioning, issue creation, PR activity, and delivery outcome.",
  },
  {
    title: "Optional deploy validation",
    body: "Repo handoff is the default finish line. Add Vercel credentials when you want a validated production URL on the same run.",
  },
];

export function WhatYouGet() {
  return (
    <section className={styles.section}>
      <span className={styles.label}>What you get</span>
      <h2 className={styles.heading}>Not a demo. A real repo handoff.</h2>
      <p className={styles.subtitle}>
        The current beta gets you through entitlement, GitHub auth, BYOK,
        provisioning, and pipeline execution in a repo you own. Deployment is
        validated when you configure it.
      </p>
      <div className={styles.grid}>
        {DELIVERABLES.map((d) => (
          <div key={d.title} className={styles.item}>
            <h3 className={styles.itemTitle}>{d.title}</h3>
            <p className={styles.itemBody}>{d.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
