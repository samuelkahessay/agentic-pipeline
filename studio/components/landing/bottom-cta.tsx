import styles from "./bottom-cta.module.css";

const MAILTO = "mailto:kahessay@icloud.com?subject=PRD%20Submission";

export function BottomCta() {
  return (
    <footer className={styles.section}>
      <h2 className={styles.heading}>Request beta access. One run. $1.</h2>
      <p className={styles.body}>
        Email your PRD or rough brief. We reply with a manual access code for
        one invite-only beta run and tell you which credentials you&apos;ll need.
      </p>
      <a href={MAILTO} className={styles.ctaPrimary}>Request an access code</a>
      <a
        href="https://github.com/samuelkahessay/prd-to-prod"
        className={styles.ctaLink}
        target="_blank"
        rel="noopener"
      >
        View on GitHub
      </a>
    </footer>
  );
}
