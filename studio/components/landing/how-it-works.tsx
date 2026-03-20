import { PipelineAnimation } from "./pipeline-animation";
import styles from "./how-it-works.module.css";

const STEPS = [
  { num: "01", title: "Unlock", body: "Manual $1 entitlement, GitHub auth, and BYOK credentials", color: "accent" },
  { num: "02", title: "Decompose", body: "PRD to scoped GitHub issues with acceptance criteria", color: "accent" },
  { num: "03", title: "Build", body: "Agents implement each issue and open PRs with tests", color: "accent" },
  { num: "04", title: "Review", body: "Automated review checks the spec while policy gates keep control with humans", color: "policy" },
  { num: "05", title: "Handoff", body: "Repo link always. Deployment validation when Vercel credentials are configured", color: "good" },
];
const HUMAN_BOUNDARY_URL =
  "https://github.com/samuelkahessay/prd-to-prod/blob/main/autonomy-policy.yml";

const STEP_CLASS: Record<string, string> = {
  policy: styles.stepPolicy,
  good: styles.stepGood,
};

const NUM_CLASS: Record<string, string> = {
  accent: styles.stepNumAccent,
  policy: styles.stepNumPolicy,
  good: styles.stepNumGood,
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className={styles.section}>
      <div className={styles.labelRow}>
        <span className={styles.label}>How it works</span>
        <span className={styles.dot}>&middot;</span>
        <span className={styles.labelGhaw}>Powered by GitHub Agentic Workflows</span>
      </div>
      <h2 className={styles.heading}>
        Agents build inside a human-owned boundary.
      </h2>
      <p className={styles.subtitle}>
        The beta flow is explicit: entitlement, GitHub auth, BYOK, repo
        provisioning, then bounded agent execution inside policy.
      </p>

      <div className={styles.animation}>
        <PipelineAnimation />
      </div>

      <div className={styles.steps}>
        {STEPS.map((step) => (
          <div
            key={step.num}
            className={`${styles.step} ${STEP_CLASS[step.color] || ""}`}
          >
            <p className={`${styles.stepNum} ${NUM_CLASS[step.color] || ""}`}>
              {step.num}
            </p>
            <p className={styles.stepTitle}>{step.title}</p>
            <p className={styles.stepBody}>{step.body}</p>
          </div>
        ))}
      </div>

      <div className={styles.credibility}>
        <p className={styles.credibilityBody}>
          Built on <strong>GitHub Agentic Workflows</strong> — an open framework
          from GitHub for autonomous development workflows. 31 upstream findings
          filed, 17 fixes shipped across 7 releases.
        </p>
      </div>

      <div className={styles.boundaryCard}>
        <div className={styles.boundaryHeader}>
          <p className={styles.boundaryLabel}>Human boundary</p>
          <a
            className={styles.boundaryLink}
            href={HUMAN_BOUNDARY_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            Read the autonomy policy
          </a>
        </div>
        <div className={styles.boundaryGrid}>
          <div className={styles.boundaryBlock}>
            <p className={styles.boundaryTitle}>Humans own</p>
            <p className={styles.boundaryBody}>
              Access codes, workflow authority, secrets, deploy routing, and
              any expansion of scope.
            </p>
          </div>
          <div className={styles.boundaryBlock}>
            <p className={styles.boundaryTitle}>Agents own</p>
            <p className={styles.boundaryBody}>
              Bounded implementation inside the repo once the beta gates are
              satisfied.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
