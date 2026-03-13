import styles from "./pricing.module.css";

const MAILTO = "mailto:sam@skahessay.dev?subject=PRD%20Submission";

export function Pricing() {
  return (
    <section id="pricing" className={styles.section}>
      <span className={styles.label}>Pricing</span>
      <h2 className={styles.heading}>Pricing</h2>
      <p className={styles.subtitle}>
        Your first project is free — so you can see exactly what the pipeline
        delivers before paying for anything.
      </p>

      <div className={styles.cards}>
        {/* Card A — Offer A (primary) */}
        <div className={`${styles.card} ${styles.cardPrimary}`}>
          <div className={styles.badge}>Most popular</div>
          <p className={styles.cardLabel}>Send a PRD</p>
          <div className={styles.price}>
            $500<span className={styles.priceUnit}>–$2K</span>
          </div>
          <p className={styles.pricePer}>per project</p>

          <ul className={styles.features}>
            <li>✓ Deployed app on Vercel with live URL</li>
            <li>✓ Real GitHub repo you own</li>
            <li>✓ CI/CD pipeline included</li>
            <li>✓ Production-grade code — reviewed, tested, merged</li>
            <li>✓ Self-healing CI — failures get fixed automatically</li>
            <li className={styles.featureMuted}>~ 24–48 hour turnaround</li>
          </ul>

          <div className={styles.tiers}>
            <p className={styles.tiersTitle}>Complexity tiers</p>
            <div className={styles.tier}>
              <span>Simple app / internal tool</span>
              <span className={styles.tierPrice}>$500</span>
            </div>
            <div className={styles.tier}>
              <span>Multi-feature with integrations</span>
              <span className={styles.tierPrice}>$1K–$1.5K</span>
            </div>
            <div className={styles.tier}>
              <span>Complex (auth, multiple APIs)</span>
              <span className={styles.tierPrice}>$2K</span>
            </div>
          </div>

          <a href={MAILTO} className={styles.ctaPrimary}>Send your PRD →</a>
          <p className={styles.subCta}>First project free — no card required</p>
        </div>

        {/* Card B — Offer B (secondary) */}
        <div id="for-teams" className={styles.card}>
          <p className={styles.cardLabel}>For engineering teams</p>
          <div className={styles.price}>
            $2K<span className={styles.priceUnit}>–$5K</span>
          </div>
          <p className={styles.pricePer}>one-time setup</p>

          <ul className={styles.features}>
            <li>✓ Autonomous pipeline on your repo</li>
            <li>✓ Issues → agents → PRs → review → merge</li>
            <li>✓ CI failure detection + self-healing loop</li>
            <li>✓ Policy gates for human approval boundaries</li>
            <li>✓ LLM-agnostic (Copilot, Claude, Codex, Gemini)</li>
            <li className={styles.featureMuted}>~ 1 week setup</li>
          </ul>

          <div className={styles.tiers}>
            <p className={styles.tiersTitle}>Setup tiers</p>
            <div className={styles.tier}>
              <span>Basic pipeline (build + review + merge)</span>
              <span className={styles.tierPrice}>$2K</span>
            </div>
            <div className={styles.tier}>
              <span>Full pipeline (+ CI self-healing)</span>
              <span className={styles.tierPrice}>$3.5K</span>
            </div>
            <div className={styles.tier}>
              <span>Full + meeting-to-main integration</span>
              <span className={styles.tierPrice}>$5K</span>
            </div>
          </div>

          <a href={MAILTO} className={styles.ctaOutline}>Get in touch →</a>
          <p className={styles.subCta}>Optional ongoing support from $200/mo</p>
        </div>
      </div>

      <div className={styles.scope}>
        <p className={styles.scopeTitle}>What's in scope today</p>
        <p className={styles.scopeBody}>
          Web apps (Next.js, Express, Node.js). Best fit for new products and
          isolated builds. No mobile, no desktop, no complex infrastructure.
          We're upfront about boundaries because the pipeline is honest about
          what it can deliver.
        </p>
      </div>
    </section>
  );
}
