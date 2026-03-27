import { Metadata } from "next";
import { StickyNav } from "@/components/landing/sticky-nav";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Pitch — prd-to-prod",
  description:
    "Autonomous delivery infrastructure for AI agents. One-pager.",
  robots: { index: false, follow: false },
};

export default function PitchPage() {
  return (
    <div className={styles.shell}>
      <header>
        <StickyNav />
      </header>

      <main className={styles.page}>
        <article className={styles.article}>
          <span className={styles.label}>prd-to-prod</span>

          <h1 className={styles.title}>
            The delivery infrastructure
            <br />
            for AI agents.
          </h1>

          <p className={styles.lede}>
            AI can write code. It can&rsquo;t ship software. We build the
            orchestration layer that turns capable agents into a governed,
            autonomous delivery pipeline.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>80</span>
              <span className={styles.statLabel}>Agent-merged PRs</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>12</span>
              <span className={styles.statLabel}>Modules delivered</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>6</span>
              <span className={styles.statLabel}>Days</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>28</span>
              <span className={styles.statLabel}>Platform bugs found</span>
            </div>
          </div>

          <hr className={styles.divider} />

          <h2>Problem</h2>

          <p>
            Every company using AI to write code still needs engineers for
            everything around the code: decomposing specs, independent review,
            deployment, CI repair, and audit trails. The models are capable
            individually. The bottleneck is the orchestration&mdash;the
            infrastructure that wraps around agents to make them reliable and
            governable.
          </p>

          <hr className={styles.divider} />

          <h2>Solution</h2>

          <p>
            <code>prd-to-prod</code> is an autonomous delivery pipeline built
            on GitHub&rsquo;s{" "}
            <a
              href="https://github.github.com/gh-aw/"
              target="_blank"
              rel="noopener"
            >
              Agentic Workflows
            </a>
            . You file a product brief as a GitHub issue. The pipeline
            decomposes it into tasks, assigns agents to implement each one, has
            a separate agent review every PR, merges on approval, deploys, and
            self-heals when CI breaks.
          </p>

          <p>
            The governance layer is repo-owned: an autonomy policy defining
            what agents can and cannot do, identity separation between builder
            and reviewer, dependency-aware orchestration, and self-healing
            loops with independent review on every fix. Agents operate inside
            the system, not above it.
          </p>

          <hr className={styles.divider} />

          <h2>Traction</h2>

          <p>
            <strong>First client build:</strong>{" "}
            <a
              href="https://www.aurrinventures.ca/"
              target="_blank"
              rel="noopener"
            >
              Aurrin Ventures
            </a>
            , a Calgary startup accelerator, is replacing a static site with a
            12-module platform (event management, judge scoring, audience
            validation, mentor matching, Stripe payments, public directory). 80
            agent-merged PRs across 133 issues in 6 days so far. Build is
            ongoing.
          </p>

          <p>
            <strong>Platform credibility:</strong> Top 3 leading community
            contributor to GitHub{" "}
            <a
              href="https://github.github.com/gh-aw/"
              target="_blank"
              rel="noopener"
            >
              Agentic Workflows
            </a>
            . 28 issues filed, 24 fixes shipped across 8 releases, 15 release
            credits. Our depth-testing surfaced bugs that GitHub&rsquo;s own
            165-agent fleet didn&rsquo;t catch.
          </p>

          <p>
            <strong>Signal:</strong>{" "}
            <a
              href="https://skahessay.dev/posts/the-new-oss"
              target="_blank"
              rel="noopener"
            >
              &ldquo;The New OSS&rdquo;
            </a>{" "}
            endorsed by Peli de Halleux (gh-aw creator, Microsoft Research),
            amplified by GitHub Next.{" "}
            <a
              href="https://skahessay.dev/posts/the-agent-interface"
              target="_blank"
              rel="noopener"
            >
              &ldquo;The Agent Interface&rdquo;
            </a>{" "}
            reposted by Don Syme (F# creator, Microsoft Research). Three
            active threads with Microsoft/GitHub&mdash;all initiated by the
            other side.
          </p>

          <hr className={styles.divider} />

          <h2>Market</h2>

          <p>
            GitHub has 100M+ developers and is actively building agent-native
            infrastructure. Factory raised $70M (Sequoia). Mendral (YC W26,
            Docker founders) is automating CI self-heal. The developer tooling
            market is converging on agent-first workflows, and the governance
            layer&mdash;who decides what ships, with what evidence&mdash;is
            where the opportunity is.
          </p>

          <hr className={styles.divider} />

          <h2>Business model</h2>

          <ul className={styles.list}>
            <li>
              <strong>Founder builds</strong> ($750&ndash;$5K)&mdash;we
              deliver a working app with the autonomous pipeline baked in
            </li>
            <li>
              <strong>Team setups</strong> ($3K&ndash;$7.5K +
              $1.5K/mo)&mdash;install the pipeline in an existing repo
            </li>
          </ul>

          <p>
            Services revenue today. The pipeline itself is the long-term
            product.
          </p>

          <hr className={styles.divider} />

          <h2>Team</h2>

          <p>
            <strong>
              <a
                href="https://linkedin.com/in/samuelkahessay"
                target="_blank"
                rel="noopener"
              >
                Samuel Kahessay
              </a>
            </strong>
            &mdash;solo founder. Former Amazon SDE (Alexa Edge ML), ATB
            Financial (data science), University of Calgary research
            (algorithmic botany, NSERC grant). Currently full-stack developer
            at Upzoids building smart city platforms for Canadian
            municipalities.
          </p>

          <p>
            Built the pipeline, wrote the thesis, filed the upstream bugs,
            delivered the first client. Looking to bring on a co-founder with
            go-to-market or infrastructure experience as the product matures.
          </p>

          <hr className={styles.divider} />

          <h2>Ask: design partners</h2>

          <p>
            Looking for early-stage companies that need software built and want
            to be the first users of autonomous delivery infrastructure. Each
            engagement hardens the pipeline. Strongest fit: founders building
            on the standard SaaS stack (Next.js, Postgres, Stripe, auth).
          </p>

          <p className={styles.contact}>
            <a href="mailto:kahessay@icloud.com">kahessay@icloud.com</a>
            &ensp;&bull;&ensp;
            <a
              href="https://linkedin.com/in/samuelkahessay"
              target="_blank"
              rel="noopener"
            >
              LinkedIn
            </a>
            &ensp;&bull;&ensp;
            <a href="https://prdtoprod.com">prdtoprod.com</a>
          </p>
        </article>
      </main>
    </div>
  );
}
