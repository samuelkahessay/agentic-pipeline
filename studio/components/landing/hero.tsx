import styles from "./hero.module.css";

const MAILTO = "mailto:kahessay@icloud.com?subject=PRD%20Submission";

export function Hero() {
  return (
    <section className={styles.hero}>
      <p className={styles.eyebrow}>Powered by GitHub Agentic Workflows</p>
      <h1 className={styles.headline}>
        Send a PRD.<br />
        Get one beta run for $1.
      </h1>
      <p className={styles.subtitle}>
        Invite-only beta: we manually issue a single-use access code, you sign
        in with GitHub, bring a Copilot token, and the pipeline provisions a
        private repo you own. Add Vercel credentials if you want deployment
        validation on the run.
      </p>
      <div className={styles.actions}>
        <a href={MAILTO} className={styles.ctaPrimary}>Request beta access</a>
        <a href="/build?demo=true" className={styles.ctaSecondary}>Watch it build</a>
      </div>
      <p className={styles.scope}>
        Invite-only beta. Greenfield web apps on the nextjs-vercel lane.
      </p>
    </section>
  );
}
