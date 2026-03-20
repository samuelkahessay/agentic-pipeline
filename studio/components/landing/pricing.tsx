import styles from "./pricing.module.css";

const MAILTO = "mailto:kahessay@icloud.com?subject=PRD%20Submission";

export function Pricing() {
  return (
    <section id="pricing" className={styles.section}>
      <span className={styles.label}>Pricing</span>
      <h2 className={styles.heading}>$1. One access code. One beta run.</h2>
      <p className={styles.subtitle}>
        We&apos;re running an invite-only beta with early adopters on Platform
        Calgary. For $1, we manually issue a single-use access code for one
        real run. Repo handoff is included; deployment validation is optional
        when you bring Vercel credentials.
      </p>

      <div className={styles.cards}>
        <div className={`${styles.card} ${styles.cardPrimary}`}>
          <div className={styles.badge}>Early adopter</div>
          <p className={styles.cardLabel}>$1 pipeline run</p>
          <div className={styles.priceTag}>
            $1
          </div>
          <p className={styles.pricePer}>per pipeline run</p>

          <ul className={styles.features}>
            <li>We manually fulfill one single-use access code</li>
            <li>You authenticate with GitHub and bring your own Copilot token</li>
            <li>The pipeline provisions a private repo you own with the workflows already wired in</li>
            <li>The build page shows gates, bootstrap, issues, PRs, and delivery evidence</li>
            <li>Runs finish at repo handoff by default</li>
            <li>Add Vercel credentials if you want validated deployment output</li>
          </ul>

          <a href={MAILTO} className={styles.ctaPrimary}>Request beta access</a>
        </div>

        <div className={styles.card}>
          <p className={styles.cardLabel}>Run it yourself</p>
          <div className={styles.priceTag}>
            $0
          </div>
          <p className={styles.pricePer}>MIT licensed, forever</p>

          <ul className={styles.features}>
            <li>Full pipeline source code</li>
            <li>Bring your own LLM (Copilot, Claude, Codex, Gemini)</li>
            <li>Deploy anywhere — your infra, your rules</li>
            <li>Self-healing, review agents, auto-dispatch</li>
          </ul>

          <div className={styles.needs}>
            <p className={styles.needsTitle}>You need</p>
            <ul className={styles.needsList}>
              <li>GitHub repo + Actions</li>
              <li>LLM access (Copilot, Claude, etc.)</li>
              <li>Hosting (Vercel, Fly, etc.)</li>
            </ul>
          </div>

          <a
            href="https://github.com/samuelkahessay/prd-to-prod"
            className={styles.ctaOutline}
            target="_blank"
            rel="noopener"
          >
            View on GitHub
          </a>
        </div>
      </div>

      <div className={styles.scope}>
        <p className={styles.scopeTitle}>Scope</p>
        <p className={styles.scopeBody}>
          Invite-only beta. Greenfield web apps on the nextjs-vercel lane.
          No managed checkout, no mobile, no desktop.
        </p>
      </div>
    </section>
  );
}
